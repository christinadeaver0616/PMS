# PMS Interview Help Notes

Hey. If you do not know this project well, this file is your main guide.
Read it from top to bottom. Do not jump around on interview day.
Words inside quotes are what you say out loud.
Lines without quotes are what you do or what you need to know.

Spend extra time on PART 2B. That is Clerk, Neon, Inngest, and Brevo.
Interviewers often ask why those tools matter. PART 2B gives you a lot to say.

There are no tricks. Just follow the order.


## PART 1. Learn the app first

This app is a project management tool for a small team.
People log in. They join a team space. They make projects. They break work into tasks. They talk on tasks with comments. Sometimes the app emails people when work is assigned or due.

Imagine a small company office.
The whole office is the workspace.
One big job in that office is a project, like redesign the website.
One sticky note on that job is a task, like draw the home page.
People leave notes on that sticky note. Those are comments.

So the order is always the same.
Workspace first.
Then project.
Then task.
Then comment.


## PART 2. Learn the words in plain English

Workspace
This is the team home. In this app a workspace is the same thing as a Clerk organization. Clerk is the login service. When you make an organization in Clerk, this app treats it as a workspace.

Project
This is one job the team is doing inside the workspace. Example. Mobile app rewrite. Website launch. Hiring plan.

Task
This is one piece of work inside a project. Example. Fix login bug. Write landing copy. Design logo.

Comment
This is a short message on a task so the team can talk about that work.

Project lead
This is the person who owns the project day to day. Only the project lead can make, change, or delete tasks. Only the project lead can add people to the project.

Workspace admin
This is the person who can set up the workspace and make new projects. The person who creates the workspace is usually an admin.

Workspace member
This person belongs to the workspace but cannot make new projects. They work on projects after someone adds them.

Clerk
Short version. Login tool for people and teams. Full deep talk is in PART 2B.

Neon
Short version. Hosted Postgres database for projects and tasks. Full deep talk is in PART 2B.

Inngest
Short version. Background jobs for sync and later emails. Full deep talk is in PART 2B.

Brevo
Short version. Service that actually sends the emails. Full deep talk is in PART 2B.

Prisma
This is how the server talks to the database in a clear way.

Express
This is the server API. The React screen talks to Express. Express talks to the database.

React
This is the screen the user sees and clicks.

Redux
This is memory inside the browser. After we load workspaces once, we keep that data in Redux so the pages feel quick.


## PART 2B. Deep talk on Clerk, Neon, Inngest, and Brevo

Read this part slowly. These four tools are what interviewers often care about.
For each tool you will learn what it is, what it does in this app, why it is strong, and what you should say out loud.


### CLERK

What Clerk is in real life
Clerk is a ready made login and user system.
Without Clerk you would build sign up forms, password reset, email verify, session cookies, and team invites yourself. That takes a lot of time and is easy to get wrong.
Clerk gives you those pieces as a product you plug in.

What Clerk does in this app
People sign in and sign up with Clerk screens.
The user button in the top bar comes from Clerk.
Settings opens the Clerk user profile.
A workspace in our app is a Clerk organization.
When you invite someone on the Team page, Clerk sends that invite.
After login, the React app gets a Clerk token and sends it to our API so the server knows who is calling.

Why Clerk is powerful
It solves a hard problem that is not the heart of a project manager app.
Security around passwords and sessions is serious work. Clerk already does that well.
It also supports organizations, which maps cleanly to our workspace idea. One org equals one workspace.
It gives invites with roles like org admin and org member. We turn those into ADMIN and MEMBER in our database.
On the React side you get Sign In, Create Organization, and User Button without building those UIs from scratch.
On the server side Clerk middleware can check the token so protected routes stay protected.

What would be weaker without Clerk
You would store password hashes yourself.
You would build invite emails yourself.
You would build org membership yourself.
You would spend weeks on auth instead of projects and tasks.

What you should say about Clerk
"Clerk is our identity layer. It handles sign in, sign up, user profile, organizations, and invites. We do not store passwords in our database. In this app a Clerk organization is a workspace, and we use the same id on both sides. When the React app calls our API, it sends a Clerk token. The server checks that token before it reads or writes data. That is powerful because auth and team invites are hard and easy to get wrong, and Clerk lets us focus on the real product work like projects and tasks."

Extra Clerk lines if they want more
"Clerk is also nice for multi team use. One user can belong to more than one organization, and our app can switch workspaces the same way."
"Invites are a good example. We do not invent invite links. We call Clerk invite member, Clerk emails the person, and when they accept, a webhook flows into Inngest so our database gets the new workspace member."


### NEON

What Neon is in real life
Neon is hosted Postgres.
Postgres is a serious relational database used by many real companies.
Hosted means we do not install Postgres on our own laptop server for production. Neon runs it for us in the cloud.

What Neon does in this app
All the real work data lives here.
Users we synced from Clerk.
Workspaces.
Workspace members.
Projects.
Project members.
Tasks.
Comments.
Our server uses Prisma to talk to Neon.
We also use a Neon friendly serverless style connection so this can run well on hosts like Vercel.

Why Neon is powerful
Postgres gives you strong structure. Tables, relations, and rules fit our model well. A task belongs to a project. A project belongs to a workspace. That is natural in a relational database.
Neon makes Postgres easy to use without running database machines yourself.
It fits modern deploy styles. Your API can scale up and down, and Neon is built for that kind of cloud use.
Branch style database workflows are a Neon strength in general. Teams can copy data setups for testing. Even if you do not show that live, it is a reason people pick Neon.
It keeps production data safe and reachable with a connection string instead of a local only database that dies when your laptop sleeps.

What would be weaker without Neon or Postgres
If we only kept data in Clerk, we could not cleanly store every task and comment.
If we used only a local database file, deploy and backup would be harder.
If we used a random document store with no plan, relations like project to task would get messy fast.

What you should say about Neon
"Neon is our database. It is hosted Postgres. All project data lives there. Workspaces, members, projects, tasks, and comments. We use Prisma on top so the server can create and query that data in a clear way. Neon is powerful because we get real Postgres strength without managing database servers ourselves, and it works well with a cloud API deploy. Clerk holds who the people are. Neon holds what the team is working on."

Extra Neon lines if they want more
"We keep a clear split on purpose. Identity in Clerk. Work data in Neon. That way each tool does the job it is best at."
"Because the data is relational, the app can load a workspace and also load its projects and tasks in a structured way."


### INNGEST

What Inngest is in real life
Inngest is a background job system.
Think of it like a reliable helper that runs work after the user clicks, or later in time.
Your API can say hey, do this job. Then Inngest runs the job, retries if something fails, and can wait until a future time.

What Inngest does in this app
Two big jobs.

First, sync from Clerk.
When a user is created or updated or deleted in Clerk, Inngest helps write that into our database.
When an organization is created or updated or deleted, Inngest syncs the workspace.
When someone accepts an invite, Inngest creates the workspace member row.

Second, task email flow.
When a task is assigned, our API sends an event like app task assigned.
Inngest picks that up, loads the task, and sends assignment mail.
If there is a future due date, Inngest can sleep until that date and then send a reminder if the task is still not Done.

Why Inngest is powerful
The user click stays fast. Creating a task should not wait while email is sending.
Jobs can wait for a due date without you building a cron server.
If the process fails, Inngest can retry. A plain setTimeout in Node dies when the server restarts.
It connects event style systems. Clerk webhooks become events. Our app events become emails.
You can see and manage functions in one place instead of scattering random background scripts.

What would be weaker without Inngest
You might send email inside the API request and make users wait.
You might use setTimeout and lose reminders when the server restarts.
You might build a custom cron and queue system, which is a whole product by itself.
Clerk sync could lag and you would have no clean place to handle those events.

What you should say about Inngest
"Inngest is our background engine. Anything that should not block the user click goes there. In this app that means two things. Syncing Clerk users, orgs, and accepted invites into our database. And sending task emails, including a later reminder around the due date. When a task is assigned, the API saves the task and fires an event. Inngest runs the email job through Brevo. If the due date is in the future, Inngest can wait and then remind the person if the work is still open. That is powerful because the API stays quick, and delayed work still survives server restarts, which a simple timer would not."

Extra Inngest lines if they want more
"A good way to say it is event driven side effects. The main request writes the task. The side effect sends mail."
"We also use an ensure workspace API as a safety net if webhook sync is slow on first login. Inngest is the normal path. Ensure is the backup so the user is not stuck."


### BREVO

What Brevo is in real life
Brevo is an email sending service.
Apps should not usually send mail straight from a random laptop mail account.
You use a mail provider with SMTP or an API so mail is more reliable and easier to manage.

What Brevo does in this app
When Inngest runs the assignment or reminder job, our code uses Nodemailer with Brevo SMTP.
Brevo is the service that actually delivers the email to the person’s inbox.
The app prepares the message content. Brevo sends it.

Why Brevo is powerful
Sending email looks simple until you do it for real. Spam filters, delivery, sender identity, and SMTP setup are annoying.
Brevo gives you a real outbound mail path with credentials you can keep in env values.
It separates mail delivery from app logic. Our code decides when and what to send. Brevo handles delivery.
It works with the Inngest flow. Inngest times the job. Brevo delivers the message.
For a product demo and a real team tool, this is much stronger than hoping the server can send mail by itself.

What would be weaker without Brevo
Local server mail often lands in spam or fails.
You would mix delivery problems with app bugs and waste time debugging the wrong layer.
You would not have a clean production style mail setup.

What you should say about Brevo
"Brevo is our email delivery service. Inngest decides when to send. Our app builds the message. Brevo delivers it through SMTP. We use that for task assignment mail and due date reminders. Brevo is powerful because reliable email delivery is its own hard problem, and we do not want the project management API to also be a mail server."

Extra Brevo lines if they want more
"If mail does not show during a live demo, the code path can still be right. Often the keys or the Inngest sync to the live server are the missing piece. I can still walk the flow in code."


### How the four tools work together

Learn this chain. It is gold in an interview.

Clerk proves who the user is and what org they belong to.
Neon stores the work that org is doing.
Inngest moves events through time and background work.
Brevo delivers the human message at the end.

Real story you can tell
"A lead creates a task and assigns it to Sam with a due date next Friday. The API checks permission and saves the task in Neon. Then it tells Inngest the task was assigned. Inngest sends Sam an email through Brevo right away. Later, near the due date, Inngest wakes up, checks that the task is still not Done, and Brevo sends a reminder. Meanwhile Sam only logged in through Clerk. That whole chain is why these tools matter together."


### Short compare so you do not mix them up

Clerk is about people and login.
Neon is about saved work data.
Inngest is about jobs that run later or in the background.
Brevo is about sending the email to a human inbox.


## PART 3. Who can do what

Please memorize this little story.

Alice is workspace admin.
Bob is only a workspace member.
Carol is the project lead.
Dave is a project member.

Alice can make a new project. Bob cannot.
Carol can make a new task. Dave cannot.
Dave can leave a comment. A stranger outside the project cannot.
Carol can add people to the project. Dave cannot.

Important idea.
We do not only hide buttons. The server also checks the rule. If the wrong person tries, the API can return 403, which means not allowed.


## PART 4. What you see on the screen

Left sidebar
You will see Dashboard, Projects, Team, and Settings.
You may also see My Tasks and a Projects list with links into Tasks, Analytics, Calendar, and Settings for a project.

Top bar
You will see a search box, a light and dark theme button, and your Clerk user button.

Dashboard page
This is the home page at slash.
It says welcome back with your name.
It shows stats like Total Projects, Completed Projects, My Tasks, and Overdue.
It shows Project Overview, Recent Activity, and small lists for My Tasks, Overdue, and In Progress.
There is a New Project button here.

Projects page
This is slash projects.
You see project cards.
You can search and filter.
There is a New Project button here too.

Team page
This is slash team.
You see people in the workspace.
There is an Invite Member button.

Project detail page
This is slash projectsDetail with an id.
Tabs are Tasks, Calendar, Analytics, and Settings.
There is a New Task button on the Tasks tab.

Task detail page
This is slash taskDetails.
You see the task info and a comment area.


## PART 5. Forms you will fill

Create New Project fields
Project Name
Description
Status. Choices are Planning, Active, Completed, On Hold, Cancelled
Priority. Choices are Low, Medium, High
Start Date
End Date
Project Lead
Team Members
Buttons are Cancel and Create Project

Create New Task fields
Title
Description
Type. Choices are Bug, Feature, Task, Improvement, Other
Priority. Choices are Low, Medium, High
Assignee. Can be Unassigned or a person email
Status. Choices are To Do, In Progress, Done
Due Date
Buttons are Cancel and Create Task

Invite Member fields
Email Address
Role. Choices are Member and Admin
Buttons are Cancel and Send Invitation


## PART 6. Get ready before the interview

Do this the day before or the morning of.

Open a terminal in the server folder.
Run npm install if you never did.
Run npx prisma db push if the database needs a sync.
Run npm run server.
The server should use port 5000.

Open another terminal in the client folder.
Run npm install if you never did.
Run npm run dev.
The client should use port 5173.

In the browser open localhost 5000.
You should see Server is live.

Then open localhost 5173.
Log in as a workspace admin.
Make sure you already have one workspace, one project, and one or two tasks so the screen is not blank.
If you want to show an invite, keep a second email ready.

If anything fails here, fix it before the call. Do not wait until interview time.


## PART 7. Your 41 minute talk in order

Use this like a script.
Do the click first.
Then read the quote out loud.


STEP 1. First three minutes. Hello and check the app

You do this.
Greet them.
Confirm the app is open on localhost 5173 and the server is running.
Ask if they want a full walkthrough or more deep tech talk. If they have no preference, follow this file.

You say this.
"Thanks for your time. I will walk through a project management app I built for teams. I will show the real workflow first, then explain how the parts fit, then we can open code if you want."


STEP 2. Minutes three to six. Tell them what the app is

You do this.
Stay on the home screen. Do not click around yet.

You say this.
"This app helps a team track work in one place. Think of it like an office. A workspace is the team. A project is one job the team is doing. A task is one to do item inside that job. A comment is the chat on that to do item."

Then say this.
"People log in with Clerk. Team data sits in Postgres on Neon. We talk to the database with Prisma. The screen is React. Background jobs like sync and email go through Inngest. And Brevo delivers the emails. Later I will explain why each of those is a strong choice."

Then say this.
"The flow I will show is simple. Join or open a workspace. Invite people. Make a project. Make tasks. Talk on a task. Then look at calendar and analytics."


STEP 3. Login and the shell around the app

You do this.
Point at the sidebar, the top bar, the workspace dropdown near the top of the sidebar, the theme button, and the user button.
If you are not logged in, log in with Clerk Sign In first.

You say this.
"We do not store passwords ourselves. Clerk handles login. After login the app loads your workspaces. A workspace matches a Clerk organization and we use the same id on both sides."

Then say this.
"If you have no workspace yet, we show Clerk create organization. If the database is still catching up after signup, you may see a short message like setting up your workspace. In that case we call an ensure API so the user is not stuck."


STEP 4. Dashboard

You do this.
Click Dashboard in the sidebar or go to slash.
Point at the stats, Project Overview, Recent Activity, and the My Tasks area.
Point at New Project but do not click it yet unless your screen is empty.

You say this.
"This is the overview. What is going on, what is mine, and what is late. Most of this comes from one API call that returns the workspace tree with members, projects, and tasks. We keep that data in Redux in the browser so moving between pages feels quick."


STEP 5. Invite a teammate

You do this.
Click Team in the sidebar.
Click Invite Member.
Show the Email Address field and the Role field with Member and Admin.
If you have a real second email, send the invite. If not, fill the form and explain without sending, or cancel.

You say this.
"This is how you bring someone onto the team. Clerk sends the invite, not our Express API. You pick Member or Admin. When they accept, Inngest writes them into our database as a workspace member."

Then say this.
"So Clerk owns who got invited. Our database owns how we use that membership for projects and rules. An admin can set up the workspace and make projects. A member can work on projects they join, but they cannot make projects."


STEP 6. Make a project

You do this.
Go to Dashboard or Projects.
Click New Project.
Fill Project Name with something simple like Website Redesign.
Add a short Description.
Set Status to Active or Planning.
Set Priority to Medium or High.
Pick Start Date and End Date if you want.
Choose a Project Lead. Pick yourself if you are demoing alone.
Add Team Members if you have people listed.
Click Create Project.
When the card appears, click it to open project detail.

You say this.
"A project is a box for related work. Only a workspace admin can make it. The project lead owns the day to day task work. Members you add now show up on the project team."

Then say this.
"When you click Create Project, the browser posts to the projects API with your login token. The server checks that you are an admin of that workspace. If yes, it saves the project in Postgres and adds the members. The UI updates Redux so the new project shows up right away. No email goes out for a new project. Email is for tasks."

Then say this if you want to sound sharp.
"If a normal member tries this, it should fail with 403. Hiding a button is not enough. The API enforces the rule."


STEP 7. Walk the project tabs

You do this.
On the project page, click Tasks.
Then click Calendar.
Then click Analytics.
Then click Settings.
Then go back to Tasks.

You say this.
"Tasks is the work list. Calendar is the same work by due date so you see what is coming and what is late. Analytics is charts from this project tasks in the browser, so there is no separate analytics database. Settings is where you edit the project and add people from the workspace."

Then say this.
"So one project page covers doing the work, planning by date, seeing progress, and setting the team."


STEP 8. Make a task and explain email

You do this.
Stay on the Tasks tab.
Click New Task.
Fill Title like Design homepage.
Add a short Description.
Pick Type like Feature or Task.
Pick Priority.
Pick an Assignee if you have one. If not, leave Unassigned or assign yourself.
Set Status to To Do.
Pick a Due Date a few days later if you can.
Click Create Task.
You should see a success toast like Task created successfully.

You say this.
"Tasks are the real work items. Types can be Task, Bug, Feature, Improvement, or Other. Status moves from To Do to In Progress to Done. Only the project lead can create, change, or delete tasks."

Then say this.
"When a task is assigned, the API does not wait on email. It saves the task first. Then it fires an Inngest event called app task assigned. Inngest sends the mail through Brevo. If the due date is later, Inngest can wait until that date and remind the person if the task is still not Done."

Then say this.
"That keeps the API quick. Slow mail work runs in the background and still works if the server restarts. A plain timer in Node would not be as safe."

If no email arrives during the demo, say this.
"If mail does not show up live, that usually means Inngest or Brevo keys are not live in this environment. The important part is that the event is fired after the task is saved."


STEP 9. Open the task and leave a comment

You do this.
Click the task row or open it from My Tasks.
On the task detail page, type a short comment like Started on the first draft.
Submit it.
You should see Comment added or similar.

You say this.
"This is where the team talks about the work. Any project member can comment. Comments refresh about every ten seconds. That is simple and good enough without a full live socket setup."


STEP 10. Close the live demo

You do this.
If you have a second workspace, switch it from the workspace dropdown.
Toggle light and dark mode once.
Come back to Dashboard.

You say this.
"That is the main path. Workspace, invite people, make a project, assign tasks, talk on the task, then check calendar and charts. Rules sit on two levels. Workspace admin versus member, and project lead versus project member."

You should reach about minute eighteen here.


STEP 11. Minutes eighteen to twenty six. Explain how parts fit and sell the four big tools

You do this.
Stop clicking. Talk. This is where you should talk a lot.
Use the lines from PART 2B. You already studied them.

You say this first for the big picture.
"Here is the big picture. The user is in the browser on a React screen. That screen sends a Clerk login token to our Express API on port 5000. The API reads and writes projects, tasks, and comments in Postgres on Neon through Prisma. Side work goes to Inngest. Brevo sends the actual email. Clerk also tells Inngest when users, orgs, or invites change."

Then say this.
"The browser never talks to the database directly. It talks to our API. The API checks who you are, then reads or writes. Email and sync are background work."

Then talk Clerk in detail.
"Clerk is our identity layer. It handles sign in, sign up, user profile, organizations, and invites. We do not store passwords in our database. In this app a Clerk organization is a workspace, and we use the same id on both sides. When the React app calls our API, it sends a Clerk token. The server checks that token before it reads or writes data. That is powerful because auth and team invites are hard and easy to get wrong, and Clerk lets us focus on the real product work like projects and tasks."

Then talk Neon in detail.
"Neon is our database. It is hosted Postgres. All project data lives there. Workspaces, members, projects, tasks, and comments. We use Prisma on top so the server can create and query that data in a clear way. Neon is powerful because we get real Postgres strength without managing database servers ourselves, and it works well with a cloud API deploy. Clerk holds who the people are. Neon holds what the team is working on."

Then talk Inngest in detail.
"Inngest is our background engine. Anything that should not block the user click goes there. In this app that means two things. Syncing Clerk users, orgs, and accepted invites into our database. And sending task emails, including a later reminder around the due date. When a task is assigned, the API saves the task and fires an event. Inngest runs the email job through Brevo. If the due date is in the future, Inngest can wait and then remind the person if the work is still open. That is powerful because the API stays quick, and delayed work still survives server restarts, which a simple timer would not."

Then talk Brevo in detail.
"Brevo is our email delivery service. Inngest decides when to send. Our app builds the message. Brevo delivers it through SMTP. We use that for task assignment mail and due date reminders. Brevo is powerful because reliable email delivery is its own hard problem, and we do not want the project management API to also be a mail server."

Then tie them together with a real story.
"Here is one real chain. A lead creates a task and assigns it to Sam with a due date next Friday. The API checks permission and saves the task in Neon. Then it tells Inngest the task was assigned. Inngest sends Sam an email through Brevo right away. Later, near the due date, Inngest wakes up, checks that the task is still not Done, and Brevo sends a reminder. Meanwhile Sam only logged in through Clerk. That is why these four tools matter together."

Then say this.
"There are two places for truth. Identity and orgs live in Clerk. Projects, tasks, and comments live in Neon. We link them by using the Clerk org id as the workspace id. When Clerk changes, Inngest updates our database. If sync is slow on first login, the ensure endpoint fills missing rows so the user can keep going."


STEP 12. Minutes twenty six to thirty four. Go deeper on one topic

Ask them which they want.
Clerk.
Neon.
Inngest and Brevo.
Permissions.
Or the database shape.

If they pick Clerk, say more from PART 2B and also say this.
"Clerk is also nice for multi team use. One user can belong to more than one organization, and our app can switch workspaces the same way. Invites are a good example. We do not invent invite links. We call Clerk invite member, Clerk emails the person, and when they accept, a webhook flows into Inngest so our database gets the new workspace member."

If they pick Neon, say more from PART 2B and also say this.
"We keep a clear split on purpose. Identity in Clerk. Work data in Neon. That way each tool does the job it is best at. Because the data is relational, the app can load a workspace and also load its projects and tasks in a structured way."

If they pick Inngest and Brevo, say more from PART 2B and also say this.
"A good way to say it is event driven side effects. The main request writes the task in Neon. The side effect sends mail through Inngest and Brevo. We also use an ensure workspace API as a safety net if webhook sync is slow on first login. Inngest is the normal path. Ensure is the backup so the user is not stuck."

If they pick permissions, say this.
"Let me make permissions real. Alice is workspace admin. Bob is only a member. Carol is project lead. Dave is a project member. Alice can make the project. Bob cannot. Carol can make tasks. Dave cannot. Dave can comment. Someone outside the project cannot. We check this on the server, not only by hiding buttons."

If they pick database shape, say this.
"A user links to workspace members. A workspace holds projects. A project holds project members and tasks. A task holds comments. Roles are Admin and Member. Project status can be Active, Planning, Completed, On Hold, or Cancelled. Task status can be To Do, In Progress, or Done. Priority can be Low, Medium, or High."


STEP 13. Minutes thirty four to forty one. Open code and close

You do this.
Only open one or two files. Do not open everything.

If they care about data, open server prisma schema.prisma.
If they care about email or sync, open server inngest index.
If they care about the login shell, open client src pages Layout.jsx.
If they care about create project rules, open server controllers projectController.
If they care about create task and the email event, open server controllers taskController.

You say this while pointing at the file.
"This file is where that rule or flow lives. I can walk one function if you want."

Then close with this.
"So to wrap up, Clerk handles people and orgs. Our API and Postgres handle project work. Inngest handles sync and mail. React and Redux handle the screen. And we enforce rules on the server at workspace and project level. Happy to go deeper on any part."


## PART 8. Extra answers if they ask

If they ask what problem this solves
"Teams need one place for work by team and project with owners, status, and reminders. Not a pile of chats and sheets."

If they ask why Clerk
"Login is easy to get wrong. Clerk gives sign in, orgs, and invites so we can focus on projects and tasks. It is our identity layer, and a Clerk organization maps one to one with a workspace."

If they ask why Neon
"Neon is hosted Postgres. It stores workspaces, projects, tasks, and comments. We get real relational database strength without running database servers ourselves, and it fits a cloud API deploy."

If they ask why Inngest
"Some work should not block the API, like waiting until a due date. Inngest runs that in the background in a solid way. It also syncs Clerk events into our database and can retry if a job fails."

If they ask why Brevo
"Reliable email delivery is its own hard problem. Brevo sends the mail through SMTP while Inngest decides when to send and our app builds the message."

If they ask why one big workspaces GET
"It keeps the client simple for this size. The tradeoff is a bigger payload. For a bigger product I would split endpoints and add caching."

If they ask if this is multi tenant
"Yes, by workspace. Each Clerk org maps to one workspace. Users only see workspaces they belong to."

If they ask how front and back stay aligned on rules
"The UI hides actions for a cleaner feel. Every write still rechecks role. A non admin create project gets 403."

If they ask what you would improve next
"I would add live comments instead of polling, stronger checks on comment reads, real search, cleaner dashboard numbers, and maybe an in app notification center."

If they ask about weak spots
"Top search is visual only for now. There is an unused Settings page file. Profile settings open through Clerk. And analytics are computed in the browser from loaded tasks."

If they ask how to start the app
"In the server folder I run npm install, then npx prisma db push, then npm run server. In the client folder I run npm install, then npm run dev. Server first, then client."


## PART 9. If something breaks during the demo

If you see Setting up your workspace for a long time
Wait a few seconds.
Mention the ensure API.
If needed, create an organization in the Clerk screen.

If you cannot create a project
You are probably not an admin.
Switch to an admin account.
Or use the fail to show permissions.

If you cannot create a task
You are probably not the project lead.
Say that out loud. It shows you understand the rules.

If invite fails
Clerk Organizations must be turned on in the Clerk dashboard.

If no email arrives
Do not panic.
Open the task controller or Inngest file and explain the path.
Say Brevo and Inngest need live keys.

If the server errors
Look at the server terminal.
Confirm port 5000.
Restart with npm run server.

If the screen looks empty
Create one project and one task live while you talk.
That still makes a good demo.


## PART 10. One page cheat for interview day

Before call
Server on 5000. Client on 5173. Logged in as admin. Seed data ready.

Talk order
1. Hello
2. What the app is
3. Login shell
4. Dashboard
5. Invite
6. New project
7. Project tabs
8. New task and email story
9. Comment
10. Switch workspace or theme
11. Big picture architecture
12. One deep topic
13. Open one file and close

Remember
Workspace then project then task then comment.
Admin makes projects.
Lead makes tasks.
Member comments.
Clerk for people and login.
Neon for saved work data.
Inngest for background jobs and later reminders.
Brevo for sending email to inboxes.

Practice once out loud with a timer.
Study PART 2B until you can explain Clerk, Neon, Inngest, and Brevo without reading every line.
Try to finish the click demo by minute eighteen so you have time to talk about those four tools.
