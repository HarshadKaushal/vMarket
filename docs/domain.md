# Domain notes

VMarket is a market of shops. A shop has stock it is not selling. It can offer some of that stock to the other shops. Another shop can take the offer. The goods then sit on the receiver's shelf as a new product, and the sender has less of the original product.

This is a transfer of stock between shops. It is not a customer checkout, and it is not a bid.

## Assumptions

- A person who signs up is a shopkeeper, and that person has one shop. The person's name and the shop's name are different.
- The home page is a list of shops, not a list of login accounts.
- Anyone may look at shops, a shop's shelf, and the open offers. Changing stock requires login.
- "My products" means the shelf of the shop on the cookie. A shopkeeper does not pass a shop id in the body to act as someone else.
- Logout means "this browser is done." It does not withdraw offers or delete products.
- Two product rows may share a name. Accept does not look for a matching name on the destination shelf.
- The unit price is an asking price for that offer only. The product row has no price. A later offer of the same product may use another price.
- Comparing offers is a person looking at the board. The software does not rank, negotiate, or auto-accept.
- `rejected` was left on the status enum from the design discussion. No business action sets it. The sender cancels. The receiver either accepts or ignores the offer.
- Stock is a whole number of units. Money is a decimal with two places. Ids are bigints and travel as strings in JSON.

## Business rules

| Rule | Decision |
|---|---|
| Who may publish | The shop that owns the product. |
| How much | A positive quantity. Pending quantities for that product, added together, cannot exceed the shelf. |
| What happens to the shelf at publish | Nothing. The number stays until accept. The pending rows reserve it. |
| Price | Greater than zero, chosen at publish, not edited later. Total is quantity times unit price, stored by the database. |
| Who the offer is for | Nobody yet. `destination_shop_id` is null while the offer is pending. |
| Who may accept | Any other shop. The source shop cannot accept its own offer. |
| What accept does | Status becomes `accepted`. A new product row is inserted on the destination shop with the transferred quantity. The source product quantity decreases by that amount. The destination product id is stored on the request. |
| Who may cancel | The source shop, and only while the request is pending. Cancel does not move quantity. |
| Accept and cancel together | Whichever transaction still sees `pending` wins. The other gets "no longer pending." |
| Editing the shelf under an offer | Quantity cannot fall below the sum of pending offers for that product. |
| Deleting a product | Refused while a pending offer points at it. Also refused after the product has been part of any transfer, because the old request row still points at it. |
| Duplicate email | The second signup fails. The shopkeeper and shop inserts roll back together. |
| Unknown email or wrong password | One message: "Invalid email or password." |

## Decision logic on the board

The board lists pending offers only. Accepted and cancelled rows remain in `transfer_requests` as history and disappear from the view.

For each card, the page compares the offer's source shop with the logged-in shop:

- Same shop: **Cancel**.
- Different shop: **Accept**.
- No login: no button. The offer is still shown.

The server repeats that check. A forged accept of your own offer is 403. A forged cancel of someone else's offer is 404, because the cancel function looks up the id and the source shop together.

## What the assignment described, and what this model does

The sample story creates an export that already names the target shop. This app publishes an open offer and fills in the target at accept time, so more than one shop can see the same offer. The stored row still has a source and, after accept, a destination.

The sample diagram keeps the stall on the shopkeeper row. This app uses a shop row so the public list does not need the person's password hash. One shopkeeper still has one shop.
