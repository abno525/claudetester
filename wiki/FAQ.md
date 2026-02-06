# FAQ

Frequently asked questions about Minecraft CAPTCHA.

---

### What if the user has never played Minecraft?

The CAPTCHA displays the target item name and provides all the necessary materials. While familiarity with Minecraft helps, the challenge is solvable through trial and error within the allowed attempts. On "easy" difficulty, recipes are simple (2-3 items) and intuitive.

### Can bots solve this CAPTCHA?

The system is designed to make automated solving difficult:

- Recipes require spatial reasoning about item placement on a grid
- Decoy materials are included to increase the search space
- Rate limiting prevents brute-force attempts
- Challenge tokens are time-limited and single-use

No CAPTCHA is unbreakable, but the goal is to make automated solving more expensive than the value of bypassing it.

### How many recipes are supported?

The recipe database can include any subset of Minecraft's crafting recipes. The recommended set covers 50-100 well-known recipes across all difficulty levels. You can also define custom recipes.

### Does it work on mobile?

Yes. The crafting grid supports both mouse drag-and-drop and touch interactions. The UI is responsive and adapts to smaller screens.

### Can I customize the appearance?

Yes. The widget supports themes (`classic` and `dark` are built-in) and can be further styled with CSS. The container element and its children use BEM-style class names for easy targeting.

### What happens if the challenge times out?

The `onExpire` callback fires, and the user must request a new challenge. Expired challenge tokens are rejected by the server.

### Can I self-host the CAPTCHA server?

Yes. Minecraft CAPTCHA is designed to be self-hostable. You run the backend on your own infrastructure, which means you control the data and there are no third-party dependencies.

### How is the verification cookie secured?

The cookie is:

- **HttpOnly** — not accessible via JavaScript
- **Secure** — only sent over HTTPS
- **SameSite=Strict** — not sent with cross-site requests
- **Signed** — HMAC-signed with your secret key to prevent forgery
- **Time-limited** — expires after a configurable duration

### What if my question isn't answered here?

Open an issue on the GitHub repository and we'll add it to this FAQ.
