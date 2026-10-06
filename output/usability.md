# Campus Customs: Usability Improvements

Four improvements we made, two to the frontend (what shoppers see) and two to the backend (what runs behind the scenes).

---

## Frontend

### 1. Clean, Uniqlo-style redesign of the whole site

**What we did:** Restyled the site with a white background, light grey image areas, black text, square corners, thin borders, and a small touch of red. We added a slim "Free shipping" bar at the top, a tidy navigation bar (Home, Products, About Us, Log in, Create account), a larger product grid, and a footer with help links and a newsletter signup.

**Why we added it:** The old look (heavy black and pink, big rounded boxes, glowing shadows) was busy and made it hard to focus on the clothes. Uniqlo's style is calm and puts the product photos first.

**How it helps shoppers:**
- Product photos stand out, so it is easier to compare items quickly.
- Prices, sizes, and stock status are easy to read.
- The same simple layout on every page means shoppers always know where to click.
- It works on phones and laptops, so students can shop from anywhere.

---

### 2. A calmer, more helpful chat assistant

**What we did:** Redesigned the chat window to feel like a personal stylist instead of a basic support box. Highlights:
- A simple chat icon (no emoji) with a small "Ask our stylist" label.
- A personal greeting, such as "Good afternoon, Sam."
- On a product page, a small card shows which item you are looking at, so you can see the assistant knows it too.
- One-tap suggestion buttons, like "What sizes are available?"
- Product results in the chat slide sideways like a mini catalogue.
- Clean message text, with bold words and lists shown properly.
- A note that says "AI stylist. Verify details at checkout."

**Why we added it:** The old chat looked and felt generic, and shoppers had to know what to type. We wanted it to feel welcoming and easy to use.

**How it helps shoppers:**
- No need to think of what to ask. The suggestion buttons give a quick start.
- On a product page, shoppers can just ask "Is this in pink?" without naming the item.
- Browsing results in the chat is quick and does not fill up the screen.
- Being honest that it is an AI and to double-check at checkout builds trust.

---

## Backend

### 3. The site no longer freezes while the assistant is thinking

**What we did:** Before, when one shopper sent a chat message, the whole server waited for the AI to answer (about 3 to 8 seconds). During that time nobody else could log in, load products, or chat. We changed the chat code so it can wait for the AI without blocking everyone else.

**Why we added it:** With several shoppers on the site at once, one slow chat would make the whole shop feel stuck or broken.

**How it helps shoppers:**
- Pages, logins, and product lists stay fast even while someone is chatting. In our test, a chat request took about 5 seconds, but the health check still answered in 0.04 seconds and the product list in 0.004 seconds.
- More shoppers can use the shop and the assistant at the same time.

---

### 4. The assistant now always follows its full instructions

**What we did:** The assistant has an instruction file that tells it how to behave: be friendly, always check the database for prices and stock, never ask for passwords, and so on. We found that the server could not find this file if it was started from the main project folder, so it quietly used a one-line backup instead. We fixed the file path so the full instructions always load, and the server now shows a clear error if the file is ever missing.

**Why we added it:** Without the full instructions, the assistant was less careful and less helpful. It could be vague or ask unnecessary questions, and the safety rules were missing.

**How it helps shoppers:**
- Prices, sizes, and stock counts come from the real database, not guesses.
- Out-of-stock items are clearly flagged, with alternatives suggested.
- The assistant keeps its safety rules, such as never asking for passwords or payment details in chat.
- Answers are consistent, no matter how the server was started.

---

## Quick Summary

| # | Area | Improvement | Shopper benefit |
|---|------|-------------|-----------------|
| 1 | Frontend | Clean Uniqlo-style redesign | Easier to browse and compare products |
| 2 | Frontend | Premium stylist-style chat | Faster, friendlier help and product-aware answers |
| 3 | Backend | Server stays responsive during chats | Fast pages even when others are chatting |
| 4 | Backend | Full assistant instructions always load | Accurate, safe, consistent answers |
