const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

require('dotenv').config();

class HKULibraryBooking {
    constructor() {
        this.baseUrl = 'https://booking.lib.hku.hk';
        this.loginUrl = `${this.baseUrl}/Secure/Login.aspx`;
        this.bookingUrl = `${this.baseUrl}/Secure/NewBooking.aspx`;
        this.browser = null;
        this.page = null;
        this.config = null;
    }

    getTomorrowDate() {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const year = tomorrow.getFullYear();
        const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
        const day = String(tomorrow.getDate()).padStart(2, '0');
        return `${year}${month}${day}`;
    }

    getTomorrowDateFormatted() {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const year = tomorrow.getFullYear();
        const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
        const day = String(tomorrow.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    async loadConfig(configPath = 'config.json') {
        try {
            const configData = await fs.readFile(configPath, 'utf8');
            this.config = JSON.parse(configData);
            
            console.log('✓ Configuration loaded successfully');
            
            // Check if credentials are provided in environment variables
            if (process.env.HKU_USERNAME && process.env.HKU_PASSWORD) {
                console.log('✓ Using credentials from environment variables');
                this.config.credentials.username = process.env.HKU_USERNAME;
                this.config.credentials.password = process.env.HKU_PASSWORD;
            } else if (!this.config.credentials.username || !this.config.credentials.password) {
                throw new Error('Credentials not found in config.json or environment variables');
            }

            // Auto-update the date to tomorrow
            const tomorrowDate = this.getTomorrowDate();
            this.config.preferences.defaultDate = tomorrowDate;
            console.log(`📅 Booking date set to: ${tomorrowDate} (Tomorrow)`);
            
            return this.config;
        } catch (error) {
            console.error('❌ Error loading config file:', error.message);
            // Create default config if doesn't exist
            const defaultConfig = {
                "credentials": {
                    "username": process.env.HKU_USERNAME,
                    "password": process.env.HKU_PASSWORD
                },
                "preferences": {
                    "defaultDate": this.getTomorrowDate(), // Auto-set to tomorrow
                    "defaultDescription": "Study session",
                    "maxRetries": 3,
                    "retryDelay": 2000,
                    "maxSuccessfulBookings": 2,
                    "stopAfterMaxBookings": true
                },
                "bookingOptions": [
                    {
                        "priority": 1,
                        "library": "5",
                        "facilityType": "29",
                        "facility": "268",
                        "sessionTime": "10001100",
                        "description": "Study Room 12 - 10:00-11:00"
                    },
                    {
                        "priority": 2,
                        "library": "5",
                        "facilityType": "29",
                        "facility": "269",
                        "sessionTime": "10001100",
                        "description": "Study Room 13 - 10:00-11:00"
                    },
                    {
                        "priority": 3,
                        "library": "5",
                        "facilityType": "29",
                        "facility": "270",
                        "sessionTime": "10001100",
                        "description": "Study Room 14 - 10:00-11:00"
                    },
                    {
                        "priority": 4,
                        "library": "5",
                        "facilityType": "29",
                        "facility": "271",
                        "sessionTime": "10001100",
                        "description": "Study Room 15 - 10:00-11:00"
                    }
                ]
            };
            
            await fs.writeFile(configPath, JSON.stringify(defaultConfig, null, 2));
            console.log('📁 Default config file created. Please edit config.json with your credentials.');
            console.log(`📅 Auto-configured for date: ${defaultConfig.preferences.defaultDate} (Tomorrow)`);
            process.exit(1);
        }
    }

    async init() {
        // Launch browser with specific options to mimic real user
        this.browser = await puppeteer.launch({
            headless: true,
            defaultViewport: null,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-web-security',
                '--disable-features=IsolateOrigins,site-per-process'
            ]
        });

        this.page = await this.browser.newPage();
        
        // Set user agent to mimic real browser
        await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        // Enable request interception to monitor network activity
        await this.page.setRequestInterception(true);
        this.page.on('request', (request) => {
            request.continue();
        });

        return this;
    }

    async login(username, password) {
        console.log('Logging in...');
        
        try {
            // Navigate to login page
            await this.page.goto(this.loginUrl, { waitUntil: 'networkidle2' });
            
            // Wait for login form to load
            await this.page.waitForSelector('input[name="userid"]', { timeout: 10000 });
            
            // Fill login form
            await this.page.type('input[name="userid"]', username);
            await this.page.type('input[name="password"]', password);
            
            // Click login button
            await this.page.click('input[name="submit"]');
            
            // Wait for navigation after login
            await this.page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 });
            
            // Check if login was successful
            const loginSuccess = await this.checkLoginSuccess();
            
            if (!loginSuccess) {
                throw new Error('Login failed - check credentials');
            }
            
            console.log('✓ Login successful!');
            return true;
            
        } catch (error) {
            console.error('Login error:', error);
            await this.page.screenshot({ path: 'login-error.png' });
            throw error;
        }
    }

    async checkLoginSuccess() {
        const pageContent = await this.page.content();
        
        const successIndicators = [
            pageContent.includes('Logout'),
            pageContent.includes('Welcome'),
            !pageContent.includes('input[name="submit"]'),
            await this.page.$('input[name="submit"]') === null
        ];
        
        const failureIndicators = [
            pageContent.includes('Login failed'),
            pageContent.includes('Invalid credentials'),
        ];
        
        if (failureIndicators.some(indicator => indicator)) {
            return false;
        }
        
        return successIndicators.some(indicator => indicator);
    }

    async tryMultipleBookings() {
        if (!this.config) {
            throw new Error('Configuration not loaded');
        }

        const bookingOptions = this.config.bookingOptions.sort((a, b) => a.priority - b.priority);
        const maxRetries = this.config.preferences.maxRetries || 3;
        const maxSuccessfulBookings = this.config.preferences.maxSuccessfulBookings || 2;
        
        let successfulBookings = 0;
        const bookedOptions = [];

        const tomorrowDate = this.getTomorrowDate();
        console.log(`🔄 Trying ${bookingOptions.length} booking options for ${tomorrowDate} (Tomorrow)...`);

        for (const option of bookingOptions) {
            // Stop if we've reached the maximum number of successful bookings
            if (successfulBookings >= maxSuccessfulBookings) {
                console.log(`✅ Reached maximum of ${maxSuccessfulBookings} successful bookings. Stopping.`);
                break;
            }

            console.log(`\n🎯 Attempting option ${option.priority}: ${option.description}`);
            
            for (let attempt = 1; attempt <= maxRetries; attempt++) {
                console.log(`  Attempt ${attempt}/${maxRetries}...`);
                
                try {
                    const success = await this.bookRoom(
                        option.library,
                        option.facilityType,
                        option.facility,
                        tomorrowDate, // Use tomorrow's date
                        option.sessionTime,
                        option.description
                    );

                    if (success) {
                        console.log(`🎉 Successfully booked: ${option.description}`);
                        successfulBookings++;
                        bookedOptions.push(option);
                        
                        // Stop if we've reached the maximum
                        if (successfulBookings >= maxSuccessfulBookings) {
                            console.log(`✅ Reached maximum of ${maxSuccessfulBookings} successful bookings.`);
                            return {
                                success: true,
                                bookedOptions: bookedOptions,
                                totalBookings: successfulBookings
                            };
                        }
                        break; // Move to next option after success
                    } else {
                        console.log(`  ❌ Attempt ${attempt} failed for: ${option.description}`);
                        
                        if (attempt < maxRetries) {
                            const delay = this.config.preferences.retryDelay || 2000;
                            console.log(`  ⏳ Waiting ${delay}ms before retry...`);
                            await this.delay(delay);
                        }
                    }
                } catch (error) {
                    console.error(`  💥 Error during attempt ${attempt}:`, error.message);
                    
                    if (attempt < maxRetries) {
                        const delay = this.config.preferences.retryDelay || 2000;
                        console.log(`  ⏳ Waiting ${delay}ms before retry...`);
                        await this.delay(delay);
                    }
                }
            }
            
            console.log(`  📝 Moving to next option after ${maxRetries} attempts`);
        }

        if (successfulBookings > 0) {
            console.log(`✅ Booked ${successfulBookings} room(s) successfully for tomorrow`);
            return {
                success: true,
                bookedOptions: bookedOptions,
                totalBookings: successfulBookings
            };
        } else {
            console.log('❌ All booking options exhausted. No rooms booked for tomorrow.');
            return { 
                success: false, 
                bookedOptions: [], 
                totalBookings: 0 
            };
        }
    }

    async bookRoom(library, facilityType, facility, date, sessionTime, description = 'Study session') {
        console.log(`  Starting booking: ${description}`);
        
        try {
            // Construct booking URL
            const bookingParams = new URLSearchParams({
                library: library,
                ftype: facilityType,
                facility: facility,
                date: date,
                session: sessionTime
            });
            
            const fullBookingUrl = `${this.bookingUrl}?${bookingParams.toString()}`;
            console.log(`  Loading booking page: ${fullBookingUrl}`);
            
            // Navigate to booking page
            await this.page.goto(fullBookingUrl, { waitUntil: 'networkidle2' });
            
            // Check if we're still logged in
            if (await this.isLoginPage()) {
                throw new Error('Session expired - redirected to login page');
            }
            
            // Wait for booking form to load
            await this.page.waitForSelector('#main_btnSubmit', { timeout: 10000 });
            
            // Check if room is available (session checkbox should be enabled and not checked)
            const sessionIndex = this.getSessionIndex(sessionTime);
            const sessionCheckbox = `#main_listSession_${sessionIndex}`;
            
            const isAvailable = await this.page.evaluate((selector) => {
                const element = document.querySelector(selector);
                return element && !element.disabled;
            }, sessionCheckbox);

            if (!isAvailable) {
                console.log(`  ❌ Room not available: ${description}`);
                return false;
            }

            const isChecked = await this.page.$eval(sessionCheckbox, el => el.checked);
            if (!isChecked) {
                console.log(`  ✓ Room available, selecting: ${sessionTime}`);
                await this.page.click(sessionCheckbox);
            }
            
            // Fill description if provided
            if (description) {
                await this.page.type('#main_txtUserDescription', description);
            }
            
            console.log('  ✓ Booking form ready, submitting...');
            
            // Step 1: Click submit button
            await this.page.click('#main_btnSubmit');
            await this.delay(3000);
            
            // Wait for confirmation dialog
            try {
                await this.page.waitForFunction(
                    () => document.querySelector('#main_panelSubmit')?.style.display !== 'none',
                    { timeout: 10000 }
                );
                
                console.log('  ✓ Confirmation dialog appeared');
                
                // Step 2: Confirm booking
                await this.page.click('#main_btnSubmitYes');
                await this.delay(3000);
                
                // Wait for result
                await this.page.waitForFunction(
                    () => {
                        const panelResult = document.querySelector("#main_panelResult");
                        return panelResult?.style.display !== 'none';
                    },
                    { timeout: 15000 }
                );
                
                // Check booking result
                const result = await this.page.$eval('#main_lblResult', el => el.textContent);
                console.log(`  Booking result: ${result}`);
                
                if (result.toLowerCase().includes('success') || result.toLowerCase().includes('confirmed')) {
                    console.log('  ✓ Booking confirmed successfully!');
                    return true;
                } else {
                    console.log('  ❌ Booking failed in confirmation');
                    return false;
                }
                
            } catch (confirmationError) {
                console.log('  ❌ Confirmation dialog did not appear - room might be taken');
                return false;
            }
            
        } catch (error) {
            console.error('  💥 Booking error:', error.message);
            await this.page.screenshot({ path: `booking-error-${Date.now()}.png` });
            return false;
        }
    }

    async isLoginPage() {
        const currentUrl = this.page.url();
        return currentUrl.includes('Login.aspx') || 
               await this.page.$('input[name="userid"]') !== null;
    }

    getSessionIndex(sessionTime) {
        const sessionMapping = {
            '00000100': '0',  '01000200': '1',  '02000300': '2',  '03000400': '3',
            '04000500': '4',  '05000600': '5',  '08000900': '6',  '09001000': '7',
            '10001100': '8',  '11001200': '9',  '12001300': '10', '13001400': '11',
            '14001500': '12', '15001600': '13', '16001700': '14', '17001800': '15',
            '18001900': '16', '19002000': '17', '20002100': '18', '21002200': '19',
            '22002300': '20', '23002345': '21',
        };
        
        return sessionMapping[sessionTime] || '8';
    }

    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async getCookies() {
        const cookies = await this.page.cookies();
        console.log('=== CURRENT COOKIES ===');
        cookies.forEach(cookie => {
            console.log(`  ${cookie.name}: ${cookie.value} (domain: ${cookie.domain})`);
        });
        console.log('=== END COOKIES ===');
        return cookies;
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
        }
    }
}

// Enhanced scheduler for tomorrow's bookings
class BookingScheduler {
    constructor() {
        this.bookingSystem = new HKULibraryBooking();
    }

    async scheduleBooking(runTime) {
        const now = new Date();
        const targetTime = new Date(runTime);
        
        const timeUntilRun = targetTime.getTime() - now.getTime();
        
        if (timeUntilRun < 0) {
            console.log('❌ Scheduled time is in the past. Running immediately...');
            return this.runBooking();
        }
        
        console.log(`⏰ Booking scheduled for: ${targetTime.toLocaleString()}`);
        console.log(`📅 Will book rooms for: ${this.bookingSystem.getTomorrowDate()} (Tomorrow)`);
        console.log(`⏳ Waiting ${Math.round(timeUntilRun / 1000 / 60)} minutes...`);
        
        setTimeout(async () => {
            console.log('🕒 Scheduled time reached! Starting booking process for tomorrow...');
            await this.runBooking();
        }, timeUntilRun);
    }

    async runBooking() {
        try {
            await this.bookingSystem.loadConfig();
            await this.bookingSystem.init();
            
            const credentials = this.bookingSystem.config.credentials;
            await this.bookingSystem.login(credentials.username, credentials.password);
            
            const result = await this.bookingSystem.tryMultipleBookings();
            
            if (result.success) {
                console.log(`🎉 SUCCESS: Booked ${result.totalBookings} room(s) for tomorrow`);
                result.bookedOptions.forEach(option => {
                    console.log(`   - ${option.description}`);
                });
            } else {
                console.log('❌ FAILED: No rooms available for tomorrow');
            }
            
        } catch (error) {
            console.error('💥 Fatal error:', error);
        } finally {
            await this.bookingSystem.close();
        }
    }

    // Run at specific time every day for tomorrow's bookings
    scheduleDaily(hour, minute) {
        const now = new Date();
        const target = new Date();
        target.setHours(hour, minute, 0, 0);
        
        if (target < now) {
            target.setDate(target.getDate() + 1);
        }
        
        this.scheduleBooking(target);
        
        // Schedule for subsequent days
        setInterval(() => {
            const nextDay = new Date();
            nextDay.setDate(nextDay.getDate() + 1);
            nextDay.setHours(hour, minute, 0, 0);
            this.scheduleBooking(nextDay);
        }, 24 * 60 * 60 * 1000);
    }
}

// Main execution function
async function main() {
    const scheduler = new BookingScheduler();
    
    // Check command line arguments
    const args = process.argv.slice(2);
    
    if (args.includes('--immediate') || args.includes('-i')) {
        console.log('🚀 Running immediately for tomorrow...');
        await scheduler.runBooking();
    } else if (args.includes('--schedule') || args.includes('-s')) {
        // Schedule for 10:00 AM tomorrow (when bookings typically open)
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(10, 0, 0, 0);
        
        scheduler.scheduleBooking(tomorrow);
    } else if (args.includes('--daily') || args.includes('-d')) {
        // Run daily at 10:00 AM for tomorrow's bookings
        console.log('📅 Setting up daily booking at 10:00 AM for tomorrow\'s rooms');
        scheduler.scheduleDaily(10, 0);
    } else {
        // Interactive mode
        console.log('📋 Usage:');
        console.log('  node booking.js --immediate    Run booking immediately for tomorrow');
        console.log('  node booking.js --schedule     Schedule for tomorrow 10:00 AM');
        console.log('  node booking.js --daily        Run daily at 10:00 AM for tomorrow');
        console.log('\n🚀 Running in immediate mode for tomorrow...');
        await scheduler.runBooking();
    }
}

// Run the script
if (require.main === module) {
    main();
}

module.exports = { HKULibraryBooking, BookingScheduler };