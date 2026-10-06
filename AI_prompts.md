Problem 1: Vibe coder prompts
Prompt: Create a new AI_prompts.md file


Problem 2: Analyse the database
Prompt:
- Look inside the @data/campus_customs.db, print the contents in the console.  
-  I've created an @output/harness.md file. Let's generate a skeleton. Inside this write down each table, each field and why each field matters for the creation of a chatbot or online shop 


Problem 3: Build the Campus Customs website:
Prompt:
-  Inside the root of hw4, let's create a React, vite ts web app template. Use Yarn not npm.
-  Rather than naming the folder "web", rename as "frontend" 
-  Inside frontend, let's create a nav bar at the top of the page for our page. It's an online School stash wear shop called "Campus Customers". Include the following in the navbar: Home, Products, About Us, Log in, Create account  
-  On the product page, we need to show the images for the catalogue table in our database @../data/campus_customs.db/ It should contain basic product info (name price, description). 
-  Now let's add a floating chat panel for a chat interface at the bottom right. We want the ui not the plumbing
-  Start a small FastAPI backend app by creating a backend folder and having the logic inside main.py  


Problem 4: Create account and login
Prompt:
- Now using the current db tables, we want to have a "create account" and "login" flow. To create an account, the user has first name, last name, email, password and password confirmation. The Login flow takes an email and password. New accounts go into the users table.
  Ensure security measures are properly met 
- Great. Now create the link to the frontend
- Update @../output/harness.md with a description of how the auth works, what we store for a user and how we protect passwords. Be brief.   

Problem 5: PydanticAI agent backend
Prompt:
-  Let's build out the chatbot backend using PydanticAI agent behind FastAPI. WE then what this plugged into the widget. To create this, we need 4 files for the agent. @backend/prompts/prompt.md, @backend/agent.py, @backend/tools.py, @backend/models.py. Create these files and install the needed dependencies. Contain all backend code inside @main.py.
-  Great, here is what each file is for. @backend/prompts/prompt.md stores the system prompts, @agent.py stores the agent entry and wiring, @tools.py stores the tols the agent can call, @model.py stores the Pydantic/PydanticAI structued types. Keep a note of these in an       
   agent.md to ensure separation of concerns and consistent architecture as we continue
-  Similarly to @../../HW1/hw1/read_receipts.py, we want to use our PORTKEY_API_KEY for the ai model to make the calls. First expose the chat route so a message from the website returns a reply from the agent.
-  Great. For our agent to work, we need the agent to read from @prompts/prompt.md. Inside @prompts/prompt.md, describe the nature of the chat bot (friendly and helpful). Also add the safety and security guardrails that the Campus Customs shop bot must respect to be helpful
-  Great. Let's keep code more modular and use better practices. Inside @backend/models.py, let's add the objects to define the Chat replies, product cards that we retrieve etc, and other defined types needed for our chatbot. (Keep to YAGNI, KISS principle)
-  Ensure the changes we have made are wired to the frontend. User should be able to chat with the agent and get a response based on the catalogue and inventory tables etc. 
-  Great, in @output/harness.md, detail hoe the frontend talks to the FastAPI and how the agent is loaded and works. Keep brief. Update do not override.

Problem 6: Tools: Product info and stock
Prompt:
-  Great, let's look at the contents of tools. Let's ensure the tool can allow us to look up "Product description, price, size, number in stock when the user requests). Please double check and ensure the contents come from the db. Avoid hallucinations.
-  Ensure if items are out of stock, the user is told after the db check. Ensure this is present in the logic.
-  Great, for our updates to @backend/tools.py, update @backend/prompts/prompt.md so the agent knows to use theses tools for price and stock related questions when loaded. Also add or update return types in models.py if needed.
-  In @output/harness.md list each tool used and the explanation for which model fields were chosen for lookup results and why. Keep brief.

Problem 7: Chat search that updates the page
Prompt:
- Great, let's add a feature where when the user searches for an item, the agent searches the catalgoue, and the website dynamically chanes to show those matching items as product cards (containing image, name, price short infl). There is an api contact. The agent should
  return structured product matches and then the frontend renders. Update models.py if needed.
- Great, now let's update @prompts/prompt.md and @../output/harness.md so it describes how search results reach the page. Keep brief.

Problem 8: Customer memory:
Prompt: 
- Great, when a shopper is logged in, we want to save their chat history inside the database inside an appropriately named table and load it when they return. The agent must know who is chatting (name, email, id).
- Great, let's add page context. If someone is on a product page and asks "is X in pink?", the agent should know the item being referred to. Add the needed code to the agent context and whatever is needed for this functionality.
- Ensure history is only persisted for logged in users.
- Update @output/harness.md to contain how chat history is stored, what customer fields are seen by the agents and how page context is passed. Keep brief.

Problem 9: Usability improvements
Prompt:
    - Improve the UI based on these notes:   
      - Restyle Campus Customs to match Uniqlo's US category page aesthetic:
        clean, minimal, white, utilitarian, image-led. 
      - Design tokens: white bg, #f4f4f4 surfaces, #1a1a1a text, #ff0000 brand red (sparingly),
        Helvetica Neue, 14px body, zero radius, 1px hairlines, no shadows. 
      - Header: thin promo bar + 64px main nav (red logo block, category links with black underline
        on hover, search/account/cart icons right). 
      - Products page: breadcrumbs, title with count, category chips, filter + sort toolbar,
        4-col grid (3 tablet, 2 mobile) with grey-bg images (3:4), badges, color swatches,
        price (sale in red with strikethrough). 
      - Product detail: 2-col (image strip + details), color/size selectors as square buttons,
        black full-width CTA. 
      - Buttons: black fill/white text, 48px, square. Inputs: 44px, square, 1px border. 
      - Footer: grey, 4-column links, newsletter. 
      - Chat panel: black square button, white border panel, product cards reuse category style.

    - Improve the chat feature based on these notes:
      - Bot messages with no background (sophisticated contrast)
      - Markdown rendering for clean lists and formatting
      - Word-by-word reveal animation on bot replies (feels thoughtful, not instant)
      - Hidden timestamps, shown only on hover

    - The calls are slow at the moment. Speed them up
    - Ensure the assistant's full instructions always load

Problem 10: Style the website.
Prompt: 
- Fonts: Bodoni Moda (Vogue-style display, prices), Shippori Mincho (Japanese captions), Jost (UI sans), DM Mono (catalogue numbers)
  - Palette: Washi paper (#f5f2ec), sumi ink (#121212), vermilion accents (#c8321e) only—no other colors
  - Layout: Asymmetric 12-col editorial grid with collage rhythm, gallery-plate treatment of products, sticky vertical captions
  - Details: Hanko seal icon on launcher, SVG-only icons/ornaments, mix-blend-mode: multiply on photos, hairline rules everywhere, zero shadows
  - Motion: Restrained 300–700ms ease-out, clip-path reveals, parallax on scroll
  - Interaction: Hover → 1px vermilion underline draw, scale 1.03 on cards, cursor labels
  - Create an @output/design file and write a brief summary of the changes we have made to the style and the general rationale
  
Additional prompt:
  - Console errors: ReferenceError: Can't find variable: SpeechIcon (UI errors)
  - Add rain emojis the first time the user enters the page

Problem 11: Site testing (app check)
Prompt:
  - I need to do some site testing. We want to have a file @HW4/output/app_check.html that includes screenshots of every fucntionality and user journey we have defined in the app. The main scenarios we    
     want to cover. 1. Chat checking the entry levels of an item. The dynamic search results card appearing after a search, the usability functionalities we introduced in @HW4/output/usability.md. treat    
     these images as a product manager outlining user journeys. Cover all flows.   
  - Place images inside @output/app_check_images and reference it inside the html instead
  - 

Problem 12: Audit trail, safety, finish harness
Prompt: 
  - create an append-only audit log @output/audit_trail.json of agency loop activity telemetry (time, tool name, args, data, meta data etc). This should populate each time the agent runs.
  - Let's finish the harness. in @HW4/output/harness.md, let's define how the system works. Explain the model contents from @HW4/backend/models.py and why it was chosen. Say why certain tools and          
    abilities are chosen, safety rules and also our specs (how to run the frontend and backend, loop linits, caps etc)  

Problem 13: Push to github and submit the url
  - I'm about to push to github. Identify the secrets, important & sensitive things that should be added to my gitignore
  - Add @HW4/data/products/ and @HW4/data/campus_customs.db inside the .gitignore
  - Add a README.md to the root 





