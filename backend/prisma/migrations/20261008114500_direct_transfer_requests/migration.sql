-- A direct offer names the invited shop at insert. recipient_shop_id stays null
-- for a public board offer. The invited shop is not the destination until accept.

ALTER TABLE transfer_requests
  ADD COLUMN recipient_shop_id bigint;

ALTER TABLE transfer_requests
  ADD CONSTRAINT transfer_requests_recipient_shop_fk
  FOREIGN KEY (recipient_shop_id) REFERENCES shops (id);

ALTER TABLE transfer_requests
  ADD CONSTRAINT transfer_requests_recipient_not_source CHECK (
    recipient_shop_id IS NULL OR recipient_shop_id <> source_shop_id
  );

CREATE INDEX transfer_requests_recipient_shop_idx
  ON transfer_requests (recipient_shop_id);

-- Public board. A pending row with a recipient is private and stays off this view.
CREATE OR REPLACE VIEW open_transfer_board AS
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
WHERE transfer_requests.status = 'pending'
  AND transfer_requests.recipient_shop_id IS NULL;

-- Same shelf reservation as a public offer: the existing trigger sums every
-- pending row for the product, including direct ones.
CREATE OR REPLACE FUNCTION create_direct_transfer_request(
  p_source_shop_id bigint,
  p_source_product_id bigint,
  p_recipient_shop_id bigint,
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

  IF p_recipient_shop_id IS NULL THEN
    RAISE EXCEPTION 'recipient shop not found';
  END IF;

  IF p_recipient_shop_id = p_source_shop_id THEN
    RAISE EXCEPTION 'cannot send a direct request to your own shop';
  END IF;

  PERFORM 1
  FROM shops
  WHERE id = p_recipient_shop_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'recipient shop not found';
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
    recipient_shop_id,
    quantity,
    unit_price
  )
  VALUES (
    p_source_product_id,
    p_source_shop_id,
    p_recipient_shop_id,
    p_quantity,
    p_unit_price
  )
  RETURNING * INTO created;

  RETURN created;
END;
$$;

-- Public accept is unchanged: any shop except the source.
-- A direct offer accepts only when the caller is the invited shop.
-- Anyone else gets "not found", including after the row is no longer pending,
-- so a guessed id does not confirm that a private offer exists.
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

  IF request_row.recipient_shop_id IS NOT NULL
     AND request_row.recipient_shop_id <> p_accepting_shop_id THEN
    RAISE EXCEPTION 'transfer request not found';
  END IF;

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

-- Reject frees the reservation and does not move stock.
-- Only the invited shop matches recipient_shop_id. The source shop cancels instead.
-- Lock order matches accept and cancel: product, then the request row.
CREATE OR REPLACE FUNCTION reject_transfer_request(
  p_request_id bigint,
  p_recipient_shop_id bigint
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
    AND recipient_shop_id = p_recipient_shop_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'transfer request not found';
  END IF;

  PERFORM 1
  FROM products
  WHERE id = source_product_id
  FOR UPDATE;

  UPDATE transfer_requests
  SET status = 'rejected'
  WHERE id = p_request_id
    AND recipient_shop_id = p_recipient_shop_id
    AND status = 'pending'
  RETURNING * INTO updated;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'transfer request is no longer pending';
  END IF;

  RETURN updated;
END;
$$;
