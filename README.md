# Chiwah Automated Booker

<h3>Steps to configure:</h3>
First, run git clone on this repository or download as a zip file. Unzip the file and place in the "Downloads" folder of your computer.
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
<h3>macOS Configuration:</h3>
<h4>Method 1: Using Launchd (Recommended)</h4>
<ol>
<li>Open Terminal</li>
<li>Navigate to your project folder:
<pre><code>cd ~/Downloads/Chiwah-Booker</code></pre>
</li>
<li>Create the launchd configuration file:
<pre><code>nano ~/Library/LaunchAgents/com.hku.booking.plist</code></pre>
</li>
<li>Copy and paste this configuration:
<pre><code>&lt;?xml version="1.0" encoding="UTF-8"?&gt;
&lt;!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd"&gt;
&lt;plist version="1.0"&gt;
&lt;dict&gt;
    &lt;key&gt;Label&lt;/key&gt;
    &lt;string&gt;com.hku.booking&lt;/string&gt;
    &lt;key&gt;ProgramArguments&lt;/key&gt;
    &lt;array&gt;
        &lt;string&gt;/usr/local/bin/node&lt;/string&gt;
        &lt;string&gt;/Users/YOUR_USERNAME/Downloads/Chiwah-Booker/booking.js&lt;/string&gt;
        &lt;string&gt;--immediate&lt;/string&gt;
    &lt;/array&gt;
    &lt;key&gt;WorkingDirectory&lt;/key&gt;
    &lt;string&gt;/Users/YOUR_USERNAME/Downloads/Chiwah-Booker&lt;/string&gt;
    &lt;key&gt;StartCalendarInterval&lt;/key&gt;
    &lt;dict&gt;
        &lt;key&gt;Hour&lt;/key&gt;
        &lt;integer&gt;10&lt;/integer&gt;
        &lt;key&gt;Minute&lt;/key&gt;
        &lt;integer&gt;0&lt;/integer&gt;
    &lt;/dict&gt;
    &lt;key&gt;StandardOutPath&lt;/key&gt;
    &lt;string&gt;/tmp/hku-booking.log&lt;/string&gt;
    &lt;key&gt;StandardErrorPath&lt;/key&gt;
    &lt;string&gt;/tmp/hku-booking-error.log&lt;/string&gt;
&lt;/dict&gt;
&lt;/plist&gt;</code></pre>
Replace YOUR_USERNAME with your macOS username
</li>
<li>Save and exit (Press Ctrl+X, then Y, then Enter)</li>
<li>Load the service:
<pre><code>launchctl load ~/Library/LaunchAgents/com.hku.booking.plist</code></pre>
</li>
<li>Start the service:
<pre><code>launchctl start com.hku.booking</code></pre>
</li>
<li>Check if it's running:
<pre><code>launchctl list | grep hku</code></pre>
</li>
</ol>

<h4>Method 2: Using Crontab (Alternative)</h4>
<ol>
<li>Open Terminal</li>
<li>Edit your crontab:
<pre><code>crontab -e</code></pre>
</li>
<li>Add this line to run daily at 10:00 AM:
<pre><code>0 10 * * * cd /Users/YOUR_USERNAME/Downloads/Chiwah-Booker && /usr/local/bin/node booking.js --immediate >> /tmp/hku-booking.log 2>&1</code></pre>
Replace YOUR_USERNAME with your macOS username
</li>
<li>Save and exit (Press Ctrl+X, then Y, then Enter)</li>
</ol>

<h4>Prerequisites for macOS:</h4>
<ol>
<li><strong>Install Node.js</strong>:
<pre><code># Using Homebrew (recommended)
brew install node

# Or download from nodejs.org</code></pre>
</li>
<li><strong>Install project dependencies</strong>:
<pre><code>cd ~/Downloads/Chiwah-Booker
npm install</code></pre>
</li>
<li><strong>Configure environment</strong>:
<pre><code># Copy the example environment file
cp .env.example .env

# Edit with your credentials
nano .env</code></pre>
</li>
<li><strong>Test the script manually first</strong>:
<pre><code>node booking.js --immediate</code></pre>
</li>
</ol>

<h4>macOS Troubleshooting:</h4>
<ul>
<li><strong>Check logs</strong>:
<pre><code>tail -f /tmp/hku-booking.log</code></pre>
</li>
<li><strong>Unload/Reload service</strong>:
<pre><code>launchctl unload ~/Library/LaunchAgents/com.hku.booking.plist
launchctl load ~/Library/LaunchAgents/com.hku.booking.plist</code></pre>
</li>
<li><strong>Check Node.js path</strong>:
<pre><code>which node</code></pre>
Update the path in the .plist file if different from /usr/local/bin/node
</li>
<li><strong>Permissions</strong>: Ensure the script files have execute permissions</li>
</ul>

<h4>Manual Testing (Before Automation):</h4>
<pre><code>cd ~/Downloads/Chiwah-Booker
node booking.js --immediate</code></pre>
<h3>TODO</h3>
<p>There are currently some times when the program crashes upon startup due to network or puppeteer issues.
I would also think about making a GUI in the future. There are also some functionality improvements. </p>