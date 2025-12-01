# Chiwah Automated Booker

<h3>Steps to configure:</h3>
First, run git clone on this repository or download as a zip file. Unzip the file and place in the "Downloads" folder of your computer.
<h3>1. Modify run.bat</h3>
For windows, we will use task scheduler to schedule a task that runs the program.  Change the line:
cd /d "C:\Users\andre\Downloads\ChiwahBooker"

To
cd /d "C:\Users\Your Username\Downloads\ChiwahBooker"
and replace "Your Username" with your username. 

<h3>2. Add .env</h3>
Rename .env.example to .env.
Inside .env.example:
HKU_USERNAME=YOUR USERNAME
HKU_PASSWORD=YOUR PASSWORD
Change the username and password to your username and password.

<h3>Windows Configuration:</h3>
<h4>Task Scheduler</h4>
<ol>
<li>Open Task Scheduler (search in Start menu)</li>
<li>Click Create Basic Task</li>
<li>Name: HKU Library Booking</li>
<li>Trigger: Daily at 12:00 AM (0am)</li>
<li>Action: Start a program</li>
<li>Program: C:\Users\Your Username\Downloads\ChiwahBooker\run.bat</li>
<li>Start in: C:\Users\Your Username\Downloads\ChiwahBooker\</li>
<li>Check Open Properties dialog and click Finish</li>
<li>In Properties:</li>
<li>Run whether user is logged on or not</li>
<li>Configure for: Windows 10</li>
<li>Conditions tab: Check Run with the Highest Permissions, </li>
</ol>
