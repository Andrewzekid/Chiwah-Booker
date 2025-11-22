# Chiwah Automated Booker

<h3>Steps to configure:</h3>

<h3>1. Modify run.bat</h3>
For windows, we will use task scheduler to schedule a task that runs the program.  Change the line:
cd /d "C:\Users\andre\Downloads\Chiwah Booker"

To
cd /d "C:\Users\Your Username\Downloads\Chiwah Booker"
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
<li>Trigger: Daily at 10:00 AM</li>
<li>Action: Start a program</li>
<li>Program: C:\Windows\System32\cmd.exe</li>
<li>Arguments: /c "C:\Users\Your Username\Downloads\Chiwah Booker\run.bat"</li>
<li>Check Open Properties dialog and click Finish</li>
<li>In Properties:</li>
<li>Run whether user is logged on or not</li>
<li>Configure for: Windows 10</li>
<li>Conditions tab: Uncheck "Start the task only if the computer is on AC power</li>
</ol>
