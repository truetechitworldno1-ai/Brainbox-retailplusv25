# 🖨️ **HARDWARE SETUP GUIDE**
## **XPrinter & Scanner Configuration for BrainBox-RetailPlus V25**

---

## 📱 **XPRINTER MOBILE BLUETOOTH SETUP**

### **XPrinter 80mm Bluetooth (XP-P323B)**

#### **Physical Setup:**
1. **Unbox XPrinter** and remove all packaging
2. **Insert paper roll** (80mm thermal paper)
3. **Connect power adapter** and plug into wall outlet
4. **Press power button** to turn on printer
5. **LED Status:** Solid blue = ready, Blinking blue = pairing mode

#### **Bluetooth Pairing:**
1. **Enable Pairing Mode:**
   - Hold **POWER button** for 3-5 seconds
   - Release when blue LED starts **blinking rapidly**
   - Printer is now discoverable

2. **Connect via BrainBox:**
   - Go to **Settings** → **Printers**
   - Click **"Scan Bluetooth"** button
   - Select **"XPrinter"** or **"XP-P323B"** from list
   - Click **"Connect"**
   - Wait for "✅ XPrinter Connected!" message

3. **Test Print:**
   - Click **"Test Print"** button
   - Receipt should print immediately
   - Verify text quality and paper cutting

#### **Troubleshooting:**
- **Not Found?** → Turn OFF/ON printer, hold power button again
- **Connection Failed?** → Clear Bluetooth cache, try again
- **Print Quality Poor?** → Adjust print density in settings
- **Paper Jam?** → Open printer, remove paper, reload properly

---

### **XPrinter 58mm Bluetooth (XP-P300B)**

#### **Physical Setup:**
1. **Compact Design** - Smaller than 80mm version
2. **Insert 58mm paper roll** (narrower paper)
3. **Connect power** (usually USB charging cable)
4. **Power on** and wait for blue LED

#### **Pairing Process:**
1. **Pairing Mode:** Hold power button until blue LED blinks
2. **BrainBox Setup:**
   - Settings → Printers → "Find XPrinter"
   - Select **"XPrinter 58mm"** or **"XP-P300B"**
   - Configure as **58mm thermal**
   - Test compact receipt printing

#### **58mm vs 80mm Differences:**
- **58mm:** Compact receipts, mobile-friendly, narrower paper
- **80mm:** Standard receipts, more text space, professional look
- **Both:** Same Bluetooth setup process, same print quality

---

## 🔌 **XPRINTER USB WIRED SETUP**

### **XPrinter 80mm USB (XP-80C)**

#### **Physical Connection:**
1. **Connect USB cable** from printer to computer
2. **Power on printer** using power button
3. **Windows Auto-Install:**
   - Windows will detect printer automatically
   - Driver installs in background (no action needed)
   - "Device ready" notification appears

#### **BrainBox Configuration:**
1. **Auto-Detection:**
   - Go to Settings → Printers
   - Click **"Detect All"** button
   - XPrinter appears in **"USB Printers"** section
   - Click **"Setup This Printer"**

2. **Manual Setup (if auto-detection fails):**
   - Click **"Add Printer"**
   - Select **"USB"** connection type
   - Choose **"XPrinter"** brand
   - Model: **"XP-80C"**
   - Paper size: **"80mm Thermal"**

#### **Test & Verify:**
1. Click **"Test"** button
2. Click **"Print Test Page"**
3. Verify receipt prints with business info
4. Check auto-cut functionality

---

### **XPrinter 58mm USB (XP-58IIH)**

#### **Setup Process:**
1. **USB Connection** - Same as 80mm version
2. **Driver Installation** - Windows auto-installs
3. **BrainBox Detection** - Appears in USB printer list
4. **Configuration** - Select 58mm paper size
5. **Testing** - Verify compact receipt format

---

## 📊 **BARCODE SCANNER SETUP**

### **USB Barcode Scanner**

#### **Physical Setup:**
1. **Connect USB cable** to computer
2. **No driver needed** - Works immediately
3. **Test scan** - Scan any barcode
4. **Should type numbers** into active text field

#### **BrainBox Configuration:**
1. **Workstation Setup:**
   - Settings → Workstations → Edit workstation
   - Enable **"Scanner Configuration"**
   - Scanner Type: **"USB"**
   - Auto-submit: **Enabled**
   - Beep on scan: **Enabled**

2. **POS Integration:**
   - Go to **Point of Sale**
   - Click in barcode field
   - Scan product barcode
   - Product should appear automatically

#### **Scanner Models Supported:**
- **Honeywell Voyager 1200g** (USB)
- **Symbol LS2208** (USB)
- **Datalogic QuickScan** (USB)
- **Zebra DS2208** (USB)
- **Generic USB scanners** (Most work plug-and-play)

---

### **Bluetooth Barcode Scanner**

#### **Pairing Process:**
1. **Enable Pairing:** Hold scanner trigger + power button
2. **Windows Pairing:**
   - Settings → Bluetooth → Add device
   - Select scanner from list
   - Complete pairing

3. **BrainBox Setup:**
   - Workstation → Scanner Config
   - Type: **"Bluetooth"**
   - Test scanning functionality

---

### **Wireless Barcode Scanner**

#### **WiFi Scanner Setup:**
1. **Connect to WiFi** using scanner's WiFi setup mode
2. **Get IP address** from scanner display
3. **BrainBox Config:**
   - Scanner Type: **"Wireless"**
   - IP Address: Scanner's IP
   - Test connection

---

## 💻 **WORKSTATION HARDWARE LAYOUT**

### **Counter 1 - Main POS (Premium Setup)**
```
🖥️ Computer/Tablet: Main POS terminal
🖨️ Printer: XPrinter 80mm USB (XP-80C)
📱 Scanner: USB Barcode Scanner (Honeywell 1200g)
💰 Cash Drawer: Connected to printer (optional)
📺 Customer Display: Secondary monitor (optional)
🔊 Speakers: For audio alerts (F5-F9)
⌨️ Keyboard: For manual entry and shortcuts
```

### **Counter 2 - Mobile Setup**
```
📱 Tablet/Phone: Mobile POS interface
🖨️ Printer: XPrinter 58mm Bluetooth (XP-P300B)
📊 Scanner: Bluetooth Barcode Scanner
🔋 Power Bank: For mobile printer (if needed)
📶 WiFi: Stable internet for sync
🎧 Audio: Built-in speakers for alerts
```

### **Counter 3 - Express Lane**
```
💻 Computer: Express POS terminal
🖨️ Printer: XPrinter 80mm USB or WiFi
📡 Scanner: Wireless Barcode Scanner
⚡ UPS: Uninterruptible power supply
🌐 Network: Ethernet or WiFi connection
🔊 Audio: External speakers for busy environment
```

---

## 🔧 **ADVANCED PRINTER CONFIGURATION**

### **Receipt Customization**
1. **Business Information:**
   ```
   Company Name: Urban Supermarket Lagos
   Address: 123 Allen Avenue, Ikeja, Lagos
   Phone: +234 801 234 5678
   Email: info@urbansupermarket.com
   Registration: RC1234567
   Tax ID: TIN123456789
   ```

2. **Receipt Layout:**
   ```
   Header Text: "Welcome to Urban Supermarket!"
   Footer Text: "Thank you for your patronage!"
   Show Logo: Yes (if available)
   Show Business Info: Yes
   Show Tax Info: Yes
   Show Date/Time: Yes
   Show Cashier: Yes
   Show Customer: Yes
   Show Loyalty Info: Yes
   ```

3. **Print Settings:**
   ```
   Auto-print: Yes
   Copies: 1 (customer copy)
   Print Density: Medium
   Print Speed: Medium
   Paper Cut: Full cut after each receipt
   Open Drawer: Yes (if cash drawer connected)
   Buzzer: Yes (audio confirmation)
   ```

### **Multi-Printer Management**
1. **Set Default Printer** for each workstation
2. **Backup Printers** in case primary fails
3. **Print Queue Management** for busy periods
4. **Paper Level Monitoring** (manual check)
5. **Maintenance Schedules** for cleaning

---

## 📋 **DAILY OPERATIONS CHECKLIST**

### **Opening Procedures:**
- [ ] Turn on all XPrinters (80mm + 58mm)
- [ ] Check paper levels in all printers
- [ ] Test barcode scanners on all counters
- [ ] Verify internet connection for sync
- [ ] Login all cashier accounts
- [ ] Start cashier sessions with opening balance
- [ ] Test audio shortcuts (F5, F7, F8, F9)
- [ ] Check loyalty card system working

### **During Operations:**
- [ ] Monitor printer paper levels
- [ ] Check receipt quality regularly
- [ ] Verify barcode scanning accuracy
- [ ] Test audio alerts periodically
- [ ] Monitor multi-device sync status
- [ ] Process customer loyalty points
- [ ] Handle reward redemptions properly

### **Closing Procedures:**
- [ ] End all cashier sessions
- [ ] Generate daily sales reports
- [ ] Check printer paper for tomorrow
- [ ] Backup data (automatic with Supabase)
- [ ] Review staff performance
- [ ] Process any pending transfers
- [ ] Generate financial summaries

---

## 🆘 **TROUBLESHOOTING GUIDE**

### **XPrinter Issues:**
**Problem:** Printer not detected
- **Solution:** Turn OFF/ON, hold power button, try USB cable

**Problem:** Poor print quality
- **Solution:** Adjust print density, check paper quality

**Problem:** Paper jam
- **Solution:** Open printer, remove paper, reload properly

**Problem:** Bluetooth connection lost
- **Solution:** Re-pair device, check distance, restart printer

### **Scanner Issues:**
**Problem:** Scanner not working
- **Solution:** Check USB connection, test in notepad first

**Problem:** Wrong barcodes scanned
- **Solution:** Clean scanner lens, check barcode quality

**Problem:** No beep sound
- **Solution:** Enable beep in workstation settings

### **Software Issues:**
**Problem:** Data not syncing
- **Solution:** Check internet, verify Supabase connection

**Problem:** Audio not working
- **Solution:** Check browser permissions, enable audio

**Problem:** Login issues
- **Solution:** Verify employee accounts created properly

---

## 📞 **TECHNICAL SUPPORT**

### **TIW Support Channels:**
- **📧 Email:** truetechitworldno1@gmail.com
- **⏰ Response:** 24 hours guaranteed
- **🛠️ Remote Support:** Available for Pro/Advanced plans
- **📚 Training:** Staff onboarding included

### **Self-Help Resources:**
- **📖 User Manual:** Built into Help section
- **🎥 Video Tutorials:** Available in app
- **💬 Live Chat:** Contact support for access
- **📋 FAQ:** Common questions answered

---

**🎉 Your complete POS system with QuickBooks migration, XPrinter setup, and multi-device sync is now ready for business!**

**BrainBox-RetailPlus V25 - Comprehensive Point of Sale System**
**© 2025 Technology Innovation Worldwide (TIW)**