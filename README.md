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
<h3>##Task Scheduler</h3>
1.Open Task Scheduler (search in Start menu)
2.Click Create Basic Task
3.Name: HKU Library Booking
4.Trigger: Daily at 10:00 AM
5.Action: Start a program
6.Program: C:\Windows\System32\cmd.exe
7.Arguments: /c "C:\Users\Your Username\Downloads\Chiwah Booker\run.bat"
8.Check Open Properties dialog and click Finish
9.In Properties:
10.Run whether user is logged on or not
11.Configure for: Windows 10
12.Conditions tab: Uncheck "Start the task only if the computer is on AC power
