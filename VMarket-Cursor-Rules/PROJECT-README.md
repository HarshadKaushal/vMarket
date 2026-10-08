# VMarket — Cursor Development Rules

This directory contains the project rules for building VMarket with Cursor.

## Main goal

VMarket is not only a coding task. The project is intended to demonstrate that the developer can:

1. Understand the business problem before coding.
2. Research and understand the technologies being used.
3. Compare reasonable alternatives before making important technology decisions.
4. Understand the architecture rather than blindly generating it.
5. Understand why each major technology, pattern, library, and architectural decision was chosen.
6. Produce clean, maintainable, typed, decomposed code.
7. Understand the code well enough to explain it to a mentor/interviewer.
8. Build the application in an incremental, reviewable Git history.
9. Identify edge cases, race conditions, security concerns, scalability concerns, and failure modes.
10. Maintain documentation explaining important decisions.

## Business objective

VMarket connects shops within a market so products that may not sell in one shop can be transferred to another shop where they have a higher chance of selling.

The intended business benefits are:

- Reduce product waste.
- Reduce losses for shopkeepers.
- Reduce unnecessary transportation cost.
- Collect market-wide data.
- Provide a centralized system.

The project task describes shop listing, product listing, shopkeeper signup/login, product creation, product export requests, accepting requests, and transferring products. Backend requirements include shopkeeper creation, authentication, product CRUD, export, and acceptance/import processing.

## Source-of-truth rule

The original assignment is a requirement source, not an instruction to blindly copy every implementation detail.

The assignment explicitly allows technology choices to be researched and discussed. Therefore:

- Preserve explicit business requirements.
- Research current technology choices before replacing an outdated or unsuitable recommendation.
- Never silently change an important requirement.
- If an implementation detail from the assignment appears outdated, risky, or unsuitable, explain the issue and propose alternatives before changing it.
- Record important decisions in project documentation.

## Learning-first principle

The developer is building this project partly to learn.

Cursor must NOT optimize only for speed.

For important work:

1. Explain the problem.
2. Explain the relevant concepts.
3. Identify reasonable alternatives.
4. Compare them.
5. Explain the recommended choice.
6. Get approval when the change is an architectural or significant technology decision.
7. Implement only after the decision is understood.

Do not hide important reasoning behind generated code.

## Do not over-engineer

Use the simplest architecture that satisfies the current requirements.

Do not introduce:
- microservices without a demonstrated need,
- unnecessary design patterns,
- unnecessary dependencies,
- unnecessary abstractions,
- premature optimization,
- complex state-management libraries without justification,
- infrastructure that the project does not currently need.

Every significant abstraction should have a reason.

## Human approval

Cursor is an implementation assistant, not the project owner.

Before making a significant architectural decision, technology replacement, database schema change, authentication/security design change, dependency addition with meaningful architectural impact, or large refactor:

- explain the proposed change,
- explain alternatives,
- explain trade-offs,
- ask for approval.

Do not make major decisions silently.

For small, local, low-risk implementation details, proceed using the established project conventions.

## Definition of success

The project is successful only when both are true:

- The application works.
- The developer understands how and why it works.

A solution that works but cannot be explained is not considered complete.
