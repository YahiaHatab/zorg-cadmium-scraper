# 🛡️ ZORG-Ω: Cadmium Harvester
**High-speed extraction engine for Conference Harvester event floorplans.**



## ⚡ The ZORG Workflow (Recommended)
The most efficient way to use this scraper is by pairing it with the **ZORG-Ω Data Grabber** Chrome extension. This eliminates the need to manually inspect network traffic.

### 1. Installation
* **Scraper:** Ensure you have access to this Actor on [Apify](https://apify.com).
* **Extension:** Download the **ZORG-Ω Data Grabber** from the [Official Repository](https://github.com/YahiaHatab/zorg-browser-tools).

### 2. Execution Protocol
1. **Navigate** to your target event's floorplan page (e.g., `events.conferenceharvester.com/...`).
2. **Open the ZORG Extension** from your browser toolbar.
3. **Click "Execute Payload Copy"**: This automatically captures the required `EventID` and `EventKey`.
4. **Paste** that string into the **POST Payload** field in the Apify Input tab.
5. **Click "Execute Cookie Copy"** in the extension and **Paste** it into the **Cookie Token** field.
6. **Hit Start** on Apify to begin harvesting.

---

## 🛠️ Manual Configuration (Developer Mode)
If you prefer not to use the extension, you can manually extract the required identifiers:

1. **Open DevTools** (`F12`) and go to the **Network** tab.
2. **Refresh** the floorplan page and look for a request to `CreateBoothDivs.asp`.
3. **Copy the Payload**: Look for the `Form Data` or `Payload` tab and copy the raw string.
4. **Copy the Cookie**: Look for the `Cookie` header in the Request Headers section.

---

## 📊 Output Data
ZORG-Ω extracts all available exhibitor metadata, including:
* **Company Name** & **Booth Number**
* **Contact Details** (Email, Phone, Website)
* **Social Media Profiles**
* **Product Descriptions** & **Categories**

You can download the final dataset in **Excel, CSV, or JSON** formats directly from the Apify Dataset tab.

---

## ⚠️ Troubleshooting
* **Empty Results?** Cadmium session cookies usually expire after 20-30 minutes. If the scraper returns no data, refresh the event page and grab a fresh **Cookie Token**.
* **Login Required?** Some events require a login to see exhibitor details. Ensure you are logged into the event site before copying your cookies.

---
**Developed by YahiaHatab** *Part of the ZORG-Ω Extraction Suite*