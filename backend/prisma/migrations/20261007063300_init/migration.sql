-- VMarket schema.
-- A transfer stays in the database after the sender logs out.
-- Accept does not look at who is online. It only locks rows and moves stock.
-- unit_price is the price of one unit on that transfer. It is fixed at insert.
-- total_price is quantity times unit_price, stored so both shops read the same number.

CREATE TYPE transfer_status AS ENUM (
  'pending',
  'accepted',
  'rejected',
  'cancelled'
);

CREATE TABLE shopkeepers (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  password_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT shopkeepers_email_unique UNIQUE (email),
  CONSTRAINT shopkeepers_name_not_blank CHECK (length(btrim(name)) > 0),
  CONSTRAINT shopkeepers_email_not_blank CHECK (length(btrim(email)) > 0)
);

CREATE TABLE shops (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  shopkeeper_id bigint NOT NULL,
  name text NOT NULL,
  address text NOT NULL,
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT shops_shopkeeper_unique UNIQUE (shopkeeper_id),
  CONSTRAINT shops_shopkeeper_fk FOREIGN KEY (shopkeeper_id) REFERENCES shopkeepers (id),
  CONSTRAINT shops_name_not_blank CHECK (length(btrim(name)) > 0),
  CONSTRAINT shops_address_not_blank CHECK (length(btrim(address)) > 0)
);

CREATE TABLE products (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  shop_id bigint NOT NULL,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  quantity integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT products_shop_fk FOREIGN KEY (shop_id) REFERENCES shops (id),
  CONSTRAINT products_quantity_non_negative CHECK (quantity >= 0),
  CONSTRAINT products_name_not_blank CHECK (length(btrim(name)) > 0)
);

CREATE TABLE transfer_requests (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  source_product_id bigint NOT NULL,
  destination_product_id bigint,
  source_shop_id bigint NOT NULL,
  destination_shop_id bigint,
  quantity integer NOT NULL,
  unit_price numeric(12, 2) NOT NULL,
  total_price numeric(20, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  status transfer_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz,
  CONSTRAINT transfer_requests_source_product_fk
    FOREIGN KEY (source_product_id) REFERENCES products (id),
  CONSTRAINT transfer_requests_destination_product_fk
    FOREIGN KEY (destination_product_id) REFERENCES products (id),
  CONSTRAINT transfer_requests_source_shop_fk
    FOREIGN KEY (source_shop_id) REFERENCES shops (id),
  CONSTRAINT transfer_requests_destination_shop_fk
    FOREIGN KEY (destination_shop_id) REFERENCES shops (id),
  CONSTRAINT transfer_requests_quantity_positive CHECK (quantity > 0),
  CONSTRAINT transfer_requests_unit_price_positive CHECK (unit_price > 0),
  CONSTRAINT transfer_requests_shops_differ CHECK (
    destination_shop_id IS NULL OR source_shop_id <> destination_shop_id
  ),
  CONSTRAINT transfer_requests_status_shape CHECK (
    (
      status = 'pending'
      AND destination_shop_id IS NULL
      AND destination_product_id IS NULL
      AND accepted_at IS NULL
    )
    OR (
      status = 'accepted'
      AND destination_shop_id IS NOT NULL
      AND destination_product_id IS NOT NULL
      AND accepted_at IS NOT NULL
    )
    OR (
      status IN ('rejected', 'cancelled')
      AND destination_shop_id IS NULL
      AND destination_product_id IS NULL
      AND accepted_at IS NULL
    )
  )
);

CREATE INDEX products_shop_id_idx ON products (shop_id);
CREATE INDEX transfer_requests_source_shop_idx ON transfer_requests (source_shop_id);
CREATE INDEX transfer_requests_destination_shop_idx ON transfer_requests (destination_shop_id);
CREATE INDEX transfer_requests_pending_idx
  ON transfer_requests (created_at)
  WHERE status = 'pending';

-- Pending offers other shops compare. The sender's logout does not remove rows.
CREATE VIEW open_transfer_board AS
SELECT
  transfer_requests.id,
  transfer_requests.source_shop_id,
  shops.name AS source_shop_name,
  transfer_requests.source_product_id,
  products.name AS product_name,
  products.description AS product_description,
  transfer_requests.quantity,
  transfer_requests.unit_price,
  transfer_requests.total_price,
  transfer_requests.created_at
FROM transfer_requests
JOIN shops ON shops.id = transfer_requests.source_shop_id
JOIN products ON products.id = transfer_requests.source_product_id
WHERE transfer_requests.status = 'pending';

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER shopkeepers_set_updated_at
  BEFORE UPDATE ON shopkeepers
  FOR EACH ROW
  EXECUTE PROCEDURE set_updated_at();

CREATE TRIGGER shops_set_updated_at
  BEFORE UPDATE ON shops
  FOR EACH ROW
  EXECUTE PROCEDURE set_updated_at();

CREATE TRIGGER products_set_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE PROCEDURE set_updated_at();

-- Pending quantities for one product cannot exceed the shelf.
-- Locks the product row so two publishes cannot both pass the check.
CREATE OR REPLACE FUNCTION transfer_requests_reserve_stock()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  available integer;
  reserved integer;
  product_shop bigint;
BEGIN
  IF NEW.status <> 'pending' THEN
    RETURN NEW;
  END IF;

  SELECT quantity, shop_id
  INTO available, product_shop
  FROM products
  WHERE id = NEW.source_product_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'product not found';
  END IF;

  IF product_shop <> NEW.source_shop_id THEN
    RAISE EXCEPTION 'product does not belong to the source shop';
  END IF;

  SELECT COALESCE(SUM(quantity), 0)
  INTO reserved
  FROM transfer_requests
  WHERE source_product_id = NEW.source_product_id
    AND status = 'pending'
    AND id IS DISTINCT FROM NEW.id;

  IF reserved + NEW.quantity > available THEN
    RAISE EXCEPTION 'pending transfers would exceed stock';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER transfer_requests_reserve_stock
  BEFORE INSERT OR UPDATE OF quantity, status, source_product_id, source_shop_id
  ON transfer_requests
  FOR EACH ROW
  EXECUTE PROCEDURE transfer_requests_reserve_stock();

-- A shelf edit cannot undercut units already offered on the board.
CREATE OR REPLACE FUNCTION products_cover_pending_transfers()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  reserved integer;
BEGIN
  IF NEW.quantity >= OLD.quantity THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(SUM(quantity), 0)
  INTO reserved
  FROM transfer_requests
  WHERE source_product_id = NEW.id
    AND status = 'pending';

  IF NEW.quantity < reserved THEN
    RAISE EXCEPTION 'quantity cannot drop below pending transfer reservations';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER products_cover_pending_transfers
  BEFORE UPDATE OF quantity ON products
  FOR EACH ROW
  EXECUTE PROCEDURE products_cover_pending_transfers();

CREATE OR REPLACE FUNCTION create_transfer_request(
  p_source_shop_id bigint,
  p_source_product_id bigint,
  p_quantity integer,
  p_unit_price numeric
)
RETURNS transfer_requests
LANGUAGE plpgsql
AS $$
DECLARE
  created transfer_requests%ROWTYPE;
BEGIN
  IF p_quantity IS NULL OR p_quantity <= 0 THEN
    RAISE EXCEPTION 'quantity must be greater than zero';
  END IF;

  IF p_unit_price IS NULL OR p_unit_price <= 0 THEN
    RAISE EXCEPTION 'unit price must be greater than zero';
  END IF;

  -- Lock the shelf before the reservation trigger runs.
  PERFORM 1
  FROM products
  WHERE id = p_source_product_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'product not found';
  END IF;

  INSERT INTO transfer_requests (
    source_product_id,
    source_shop_id,
    quantity,
    unit_price
  )
  VALUES (
    p_source_product_id,
    p_source_shop_id,
    p_quantity,
    p_unit_price
  )
  RETURNING * INTO created;

  RETURN created;
END;
$$;

-- One shop wins. A second accept changes zero rows and raises.
-- Lock order is always the product, then the request.
CREATE OR REPLACE FUNCTION accept_transfer_request(
  p_request_id bigint,
  p_accepting_shop_id bigint
)
RETURNS transfer_requests
LANGUAGE plpgsql
AS $$
DECLARE
  source_product_id bigint;
  request_row transfer_requests%ROWTYPE;
  new_product_id bigint;
  updated transfer_requests%ROWTYPE;
BEGIN
  SELECT transfer_requests.source_product_id
  INTO source_product_id
  FROM transfer_requests
  WHERE transfer_requests.id = p_request_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'transfer request not found';
  END IF;

  PERFORM 1
  FROM products
  WHERE id = source_product_id
  FOR UPDATE;

  SELECT *
  INTO request_row
  FROM transfer_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF request_row.status <> 'pending' THEN
    RAISE EXCEPTION 'transfer request is no longer pending';
  END IF;

  IF request_row.source_shop_id = p_accepting_shop_id THEN
    RAISE EXCEPTION 'source shop cannot accept its own request';
  END IF;

  PERFORM 1
  FROM shops
  WHERE id = p_accepting_shop_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'accepting shop not found';
  END IF;

  IF request_row.quantity > (
    SELECT quantity FROM products WHERE id = source_product_id
  ) THEN
    RAISE EXCEPTION 'not enough stock';
  END IF;

  INSERT INTO products (shop_id, name, description, quantity)
  SELECT
    p_accepting_shop_id,
    products.name,
    products.description,
    request_row.quantity
  FROM products
  WHERE products.id = source_product_id
  RETURNING id INTO new_product_id;

  UPDATE transfer_requests
  SET
    status = 'accepted',
    destination_shop_id = p_accepting_shop_id,
    destination_product_id = new_product_id,
    accepted_at = now()
  WHERE id = p_request_id
    AND status = 'pending'
  RETURNING * INTO updated;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'transfer request is no longer pending';
  END IF;

  UPDATE products
  SET quantity = quantity - request_row.quantity
  WHERE id = source_product_id;

  RETURN updated;
END;
$$;

-- Frees reserved units. Does not move stock. Only the source shop can cancel.
CREATE OR REPLACE FUNCTION cancel_transfer_request(
  p_request_id bigint,
  p_source_shop_id bigint
)
RETURNS transfer_requests
LANGUAGE plpgsql
AS $$
DECLARE
  source_product_id bigint;
  updated transfer_requests%ROWTYPE;
BEGIN
  SELECT transfer_requests.source_product_id
  INTO source_product_id
  FROM transfer_requests
  WHERE id = p_request_id
    AND source_shop_id = p_source_shop_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'transfer request not found for this shop';
  END IF;

  PERFORM 1
  FROM products
  WHERE id = source_product_id
  FOR UPDATE;

  UPDATE transfer_requests
  SET status = 'cancelled'
  WHERE id = p_request_id
    AND source_shop_id = p_source_shop_id
    AND status = 'pending'
  RETURNING * INTO updated;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'transfer request is no longer pending';
  END IF;

  RETURN updated;
END;
$$;
