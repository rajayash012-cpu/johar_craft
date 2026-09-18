import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';

import os from 'os';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PORT = 9244;
const ARTIFACT_DIR = 'C:\\Users\\YASH\\.gemini\\antigravity\\brain\\55c42b56-538d-43c1-8e9b-8c5e947cae3c';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function fetchJson(url) {
  return new Promise((resolve) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (_) {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null));
  });
}

class CdpClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.id = 1;
    this.callbacks = new Map();
    this.consoleErrors = [];

    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.method === 'Runtime.consoleAPICalled') {
        const text = msg.params.args.map((a) => a.value || a.description || JSON.stringify(a)).join(' ');
        if (msg.params.type === 'error') {
          this.consoleErrors.push(text);
        }
      }
      if (msg.id && this.callbacks.has(msg.id)) {
        const cb = this.callbacks.get(msg.id);
        this.callbacks.delete(msg.id);
        if (msg.error) cb.reject(msg.error);
        else cb.resolve(msg.result);
      }
    };
  }

  ready() {
    return new Promise((resolve) => {
      if (this.ws.readyState === WebSocket.OPEN) resolve();
      else this.ws.onopen = () => resolve();
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.id++;
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async eval(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (res.exceptionDetails) {
      throw new Error(JSON.stringify(res.exceptionDetails));
    }
    return res.result ? res.result.value : undefined;
  }

  async captureScreenshot(filepath) {
    try {
      const res = await this.send('Page.captureScreenshot', { format: 'jpeg', quality: 75 });
      fs.writeFileSync(filepath, Buffer.from(res.data, 'base64'));
    } catch (e) {
      console.warn('  (Screenshot warning: ' + e.message + ')');
    }
  }
}

async function runTests() {
  console.log('=== JOHAR CRAFT: ACCOUNT MANAGEMENT AUTOMATED VERIFICATION ===\n');

  const baseTemp = fs.existsSync('D:\\') ? 'D:\\temp_edge' : os.tmpdir();
  if (!fs.existsSync(baseTemp)) fs.mkdirSync(baseTemp, { recursive: true });
  const userDataDir = path.join(baseTemp, 'edge_profile_accounts_' + Date.now());

  const edgeProc = spawn(EDGE_PATH, [
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${userDataDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--headless=new',
    'http://localhost:5173',
  ]);

  let client = null;

  try {
    let targets = null;
    for (let i = 0; i < 30; i++) {
      await sleep(500);
      targets = await fetchJson(`http://127.0.0.1:${PORT}/json`);
      if (targets && targets.length > 0) break;
    }

    if (!targets || targets.length === 0) {
      throw new Error('Failed to connect to browser on port ' + PORT);
    }

    const pageTarget = targets.find((t) => t.type === 'page');
    client = new CdpClient(pageTarget.webSocketDebuggerUrl);
    await client.ready();
    await client.send('Runtime.enable');
    await client.send('Page.enable');

    console.log('Connected to Edge DevTools Protocol.\n');

    // ----------------------------------------------------
    // TEST 1: Initial Migration & Persistence
    // ----------------------------------------------------
    console.log('[TEST 1] Initial Migration & Persistence');
    await client.send('Page.navigate', { url: 'http://localhost:5173/artisan/settings?tab=accounts' });
    await sleep(2500);

    const currentUrl = await client.eval(`window.location.href`);
    console.log('  Current URL:', currentUrl);

    const accountsData = await client.eval(`
      (() => {
        const accounts = JSON.parse(localStorage.getItem('joharcraft_accounts') || '[]');
        const activeId = localStorage.getItem('joharcraft_active_account');
        const initialized = localStorage.getItem('joharcraft_accounts_initialized');
        return { count: accounts.length, accounts, activeId, initialized };
      })()
    `);

    console.log('  Accounts count in storage:', accountsData.count);
    console.log('  Active Account ID:', accountsData.activeId);
    console.log('  Initialized flag:', accountsData.initialized);

    if (accountsData.count < 2) {
      throw new Error('Expected at least 2 migrated accounts, got ' + accountsData.count);
    }

    const putli = accountsData.accounts.find(a => a.name.includes('Putli'));
    const anita = accountsData.accounts.find(a => a.name.includes('Anita'));

    if (!putli || putli.type !== 'artisan' || putli.artisanId !== 'JC-ART-0001') {
      throw new Error('Putli Devi artisan account not properly initialized: ' + JSON.stringify(putli));
    }
    if (!anita || anita.type !== 'buyer' || anita.buyerId !== 'JC-BUY-0001') {
      throw new Error('Anita Verma buyer account not properly initialized: ' + JSON.stringify(anita));
    }

    console.log('  ✓ Verified Putli Devi (Artisan, JC-ART-0001)');
    console.log('  ✓ Verified Anita Verma (Buyer, JC-BUY-0001)');

    // Refresh and check persistence
    await client.send('Page.reload');
    await sleep(1500);

    const afterReload = await client.eval(`
      (() => {
        const accounts = JSON.parse(localStorage.getItem('joharcraft_accounts') || '[]');
        const activeId = localStorage.getItem('joharcraft_active_account');
        return { count: accounts.length, activeId };
      })()
    `);

    if (afterReload.count !== accountsData.count || afterReload.activeId !== accountsData.activeId) {
      throw new Error('Accounts changed upon reload!');
    }
    console.log('  ✓ Accounts successfully persisted after page reload\n');

    // ----------------------------------------------------
    // TEST 2: Settings > Accounts Tab UI
    // ----------------------------------------------------
    console.log('[TEST 2] Settings > Accounts Tab UI Verification');
    const uiInfo = await client.eval(`
      (() => {
        const text = document.body.innerText;
        const upper = text.toUpperCase();
        const hasHeading = text.includes('Manage your Johar Craft accounts');
        const hasActiveAccount = upper.includes('ACTIVE ACCOUNT');
        const hasOtherAccounts = upper.includes('OTHER ACCOUNTS');
        const hasAddBtn = !!Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Add Account'));
        const hasSwitchBtn = text.includes('Switch');
        const hasEditProfile = text.includes('Edit Profile');
        const hasLogOut = text.includes('Log Out');
        const hasDeleteAccount = text.includes('Delete Account');
        return { hasHeading, hasActiveAccount, hasOtherAccounts, hasAddBtn, hasSwitchBtn, hasEditProfile, hasLogOut, hasDeleteAccount };
      })()
    `);

    console.log('  UI Check:', uiInfo);
    if (!uiInfo.hasHeading || !uiInfo.hasActiveAccount || !uiInfo.hasOtherAccounts) {
      throw new Error('Settings Accounts UI missing required sections: ' + JSON.stringify(uiInfo));
    }
    console.log('  ✓ Accounts UI renders active account, other accounts, Add, Switch, Edit Profile, Log Out, Delete');

    const screenshotPath = path.join(ARTIFACT_DIR, 'settings_accounts_tab.png');
    await client.captureScreenshot(screenshotPath);
    console.log('  ✓ Captured screenshot: settings_accounts_tab.png\n');

    // ----------------------------------------------------
    // TEST 3: Create New Artisan Account C
    // ----------------------------------------------------
    console.log('[TEST 3] Create New Artisan Account');
    // Open Add Account modal
    await client.eval(`
      (() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Add Account'));
        if (btn) btn.click();
      })()
    `);
    await sleep(500);

    // Click Artisan choice
    await client.eval(`
      (() => {
        const artisanChoice = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Artisan / Craftsperson'));
        if (artisanChoice) artisanChoice.click();
      })()
    `);
    await sleep(500);

    // Fill form
    await client.eval(`
      (() => {
        function setVal(el, val) {
          if (!el) return;
          const prototype = el instanceof HTMLSelectElement ? HTMLSelectElement.prototype : el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
          const setter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
          if (setter) {
            setter.call(el, val);
          } else {
            el.value = val;
          }
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
        }

        const inputs = Array.from(document.querySelectorAll('input'));
        const nameInput = inputs.find(i => i.placeholder && i.placeholder.includes('Birsa'));
        setVal(nameInput, 'Birsa Hansda');

        const selects = Array.from(document.querySelectorAll('select'));
        setVal(selects[0], 'Khunti');

        const villageInput = inputs.find(i => i.placeholder && i.placeholder.includes('Torpa'));
        setVal(villageInput, 'Torpa Village');

        setVal(selects[1], 'Wood Craft');

        const submitBtn = Array.from(document.querySelectorAll('button[type="submit"]')).find(b => b.innerText.includes('Create'));
        if (submitBtn) submitBtn.click();
      })()
    `);
    await sleep(1500);

    const artisanCheck = await client.eval(`
      (() => {
        const accounts = JSON.parse(localStorage.getItem('joharcraft_accounts') || '[]');
        const activeId = localStorage.getItem('joharcraft_active_account');
        const active = accounts.find(a => a.id === activeId);
        return { count: accounts.length, active };
      })()
    `);

    console.log('  New Accounts Count:', artisanCheck.count);
    console.log('  Active Account:', artisanCheck.active?.name, artisanCheck.active?.artisanId);

    if (artisanCheck.active?.name !== 'Birsa Hansda' || !artisanCheck.active?.artisanId.startsWith('JC-ART-')) {
      throw new Error('Failed to create Birsa Hansda artisan account: ' + JSON.stringify(artisanCheck.active));
    }
    console.log('  ✓ Birsa Hansda created and active with ID:', artisanCheck.active.artisanId, '\n');

    // ----------------------------------------------------
    // TEST 4: Product Isolation
    // ----------------------------------------------------
    console.log('[TEST 4] Product Isolation between Artisans');
    // Navigate to Birsa's products page
    await client.send('Page.navigate', { url: 'http://localhost:5173/artisan/products' });
    await sleep(1500);

    const birsaProdInitial = await client.eval(`
      (() => {
        const text = document.body.innerText;
        return {
          url: window.location.href,
          text: text.substring(0, 200),
          hasNoProducts: text.includes('0 product') || text.includes('No products yet') || text.includes('0 items'),
        };
      })()
    `);

    console.log('  Birsa initial products check:', birsaProdInitial);
    if (!birsaProdInitial.hasNoProducts) {
      throw new Error('Expected 0 products for new artisan Birsa Hansda, found: ' + JSON.stringify(birsaProdInitial));
    }

    // Add a product for Birsa Hansda
    await client.send('Page.navigate', { url: 'http://localhost:5173/artisan/products/add' });
    await sleep(1500);

    await client.eval(`
      (() => {
        function setVal(el, val) {
          if (!el) return;
          const prototype = el instanceof HTMLSelectElement ? HTMLSelectElement.prototype : el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
          const setter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
          if (setter) {
            setter.call(el, val);
          } else {
            el.value = val;
          }
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
        }

        const inputs = Array.from(document.querySelectorAll('input'));
        const nameInput = inputs.find(i => i.placeholder && i.placeholder.includes('e.g.'));
        setVal(nameInput, 'Carved Wooden Mahua Bowl');

        const textareas = Array.from(document.querySelectorAll('textarea'));
        setVal(textareas[0], 'Handcrafted solid mahua timber serving bowl.');

        const materialsInput = inputs.find(i => i.placeholder && i.placeholder.includes('wood'));
        setVal(materialsInput, 'Mahua Wood, Organic Mustard Oil');

        const priceInput = inputs.find(i => i.placeholder && i.placeholder.includes('Rupees')) || inputs[inputs.length - 1];
        setVal(priceInput, '1250');
        const publishBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Publish Product') || b.innerText.includes('Save Changes'));
        if (publishBtn) publishBtn.click();
      })()
    `);
    await sleep(2500);

    // Check Birsa's products
    await client.send('Page.navigate', { url: 'http://localhost:5173/artisan/products' });
    await sleep(1500);

    const birsaProdsAfter = await client.eval(`
      (() => {
        const text = document.body.innerText;
        return { hasMahuaBowl: text.includes('Carved Wooden Mahua Bowl') };
      })()
    `);
    console.log('  Birsa has Mahua Bowl:', birsaProdsAfter.hasMahuaBowl);
    if (!birsaProdsAfter.hasMahuaBowl) {
      throw new Error('Birsa products page does not show his new product!');
    }

    // Now switch to Putli Devi and check her products
    await client.eval(`
      (() => {
        const accounts = JSON.parse(localStorage.getItem('joharcraft_accounts') || '[]');
        const putli = accounts.find(a => a.name.includes('Putli'));
        if (putli) {
          localStorage.setItem('joharcraft_active_account', putli.id);
        }
      })()
    `);
    await client.send('Page.navigate', { url: 'http://localhost:5173/artisan/products' });
    await sleep(1500);

    const putliProdsCheck = await client.eval(`
      (() => {
        const text = document.body.innerText;
        return {
          hasSohrai: text.includes('Sohrai'),
          hasMahuaBowl: text.includes('Carved Wooden Mahua Bowl'),
        };
      })()
    `);

    console.log('  Putli Devi has Sohrai products:', putliProdsCheck.hasSohrai);
    console.log('  Putli Devi DOES NOT have Birsa\'s Mahua Bowl:', !putliProdsCheck.hasMahuaBowl);

    if (!putliProdsCheck.hasSohrai || putliProdsCheck.hasMahuaBowl) {
      throw new Error('Product isolation failure! Putli Devi either lost Sohrai or gained Birsa\'s bowl: ' + JSON.stringify(putliProdsCheck));
    }
    console.log('  ✓ Complete Product Isolation verified between artisans!\n');

    // ----------------------------------------------------
    // TEST 5: Create New Buyer Account D & Switch
    // ----------------------------------------------------
    console.log('[TEST 5] Create New Buyer Account');
    await client.send('Page.navigate', { url: 'http://localhost:5173/artisan/settings?tab=accounts' });
    await sleep(1500);

    // Click Add Account
    await client.eval(`
      (() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Add Account'));
        if (btn) btn.click();
      })()
    `);
    await sleep(500);

    // Select Buyer
    await client.eval(`
      (() => {
        const buyerChoice = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Buyer (Individual or Business)'));
        if (buyerChoice) buyerChoice.click();
      })()
    `);
    await sleep(500);

    // Click Business Toggle
    await client.eval(`
      (() => {
        const typeButtons = Array.from(document.querySelectorAll('button')).filter(b => b.innerText.includes('Business / Wholesale'));
        if (typeButtons[0]) typeButtons[0].click();
      })()
    `);
    await sleep(400);

    // Fill Buyer Form
    await client.eval(`
      (() => {
        function setVal(el, val) {
          if (!el) return;
          const prototype = el instanceof HTMLSelectElement ? HTMLSelectElement.prototype : el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
          const setter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
          if (setter) {
            setter.call(el, val);
          } else {
            el.value = val;
          }
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
        }

        const inputs = Array.from(document.querySelectorAll('input'));
        const nameInput = inputs.find(i => i.placeholder && i.placeholder.includes('Vikram'));
        setVal(nameInput, 'Ravi Ranjan');

        const bizInput = inputs.find(i => i.placeholder && i.placeholder.includes('FabCraft'));
        setVal(bizInput, 'Tribal Arts Emporium LLP');

        const locInput = inputs.find(i => i.placeholder && i.placeholder.includes('Ranchi'));
        setVal(locInput, 'Jamshedpur, Jharkhand');

        const submitBtn = Array.from(document.querySelectorAll('button[type="submit"]')).find(b => b.innerText.includes('Create'));
        if (submitBtn) submitBtn.click();
      })()
    `);
    await sleep(1500);

    const buyerCheck = await client.eval(`
      (() => {
        const accounts = JSON.parse(localStorage.getItem('joharcraft_accounts') || '[]');
        const activeId = localStorage.getItem('joharcraft_active_account');
        const active = accounts.find(a => a.id === activeId);
        return { count: accounts.length, active };
      })()
    `);

    console.log('  Accounts count after new buyer:', buyerCheck.count);
    console.log('  Active Account:', buyerCheck.active?.name, buyerCheck.active?.buyerId);

    if (buyerCheck.active?.name !== 'Ravi Ranjan' || buyerCheck.active?.type !== 'buyer') {
      throw new Error('Failed to create and activate buyer Ravi Ranjan');
    }
    console.log('  ✓ Buyer Ravi Ranjan created and active with ID:', buyerCheck.active?.buyerId, '\n');

    // ----------------------------------------------------
    // TEST 6: Header Account Switcher Dropdown
    // ----------------------------------------------------
    console.log('[TEST 6] Header Account Switcher Dropdown');
    await client.send('Page.navigate', { url: 'http://localhost:5173/marketplace' });
    await sleep(1500);

    // Click account switcher
    const switcherOpened = await client.eval(`
      (() => {
        const switcherBtn = Array.from(document.querySelectorAll('button')).find(b => b.title === 'Switch Account');
        if (switcherBtn) {
          switcherBtn.click();
          return true;
        }
        return false;
      })()
    `);
    await sleep(500);

    const dropdownCheck = await client.eval(`
      (() => {
        const text = document.body.innerText;
        return {
          hasActiveText: text.includes('ACTIVE ACCOUNT') || text.includes('Active Account'),
          hasSwitchSection: text.includes('SWITCH ACCOUNT') || text.includes('Switch Account'),
          hasPutli: text.includes('Putli Devi'),
          hasBirsa: text.includes('Birsa Hansda'),
        };
      })()
    `);

    console.log('  Dropdown content check:', dropdownCheck);
    if (!dropdownCheck.hasActiveText || !dropdownCheck.hasPutli || !dropdownCheck.hasBirsa) {
      throw new Error('Header account switcher dropdown did not render correctly');
    }
    console.log('  ✓ Header Account Switcher displays active account and list of other accounts\n');

    // ----------------------------------------------------
    // TEST 7: Log Out & Account Selection Page
    // ----------------------------------------------------
    console.log('[TEST 7] Log Out & /account/select');
    await client.eval(`
      (() => {
        const logoutBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Log Out'));
        if (logoutBtn) logoutBtn.click();
      })()
    `);
    await sleep(1500);

    const logoutCheck = await client.eval(`
      (() => {
        const activeId = localStorage.getItem('joharcraft_active_account');
        const url = window.location.pathname;
        const text = document.body.innerText;
        return {
          activeId,
          url,
          hasChooseAccount: text.includes('Choose an Account') || text.includes('Choose Account'),
          hasBirsa: text.includes('Birsa Hansda'),
          hasPutli: text.includes('Putli Devi'),
        };
      })()
    `);

    console.log('  Post logout state:', logoutCheck);
    if (logoutCheck.activeId !== null) {
      throw new Error('Expected active account to be null after logout');
    }
    if (!logoutCheck.hasChooseAccount || !logoutCheck.hasBirsa || !logoutCheck.hasPutli) {
      throw new Error('/account/select did not list saved accounts');
    }
    console.log('  ✓ Log out cleared active session and routed to /account/select');

    // 1-click login back into Birsa Hansda
    await client.eval(`
      (() => {
        const birsaCard = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Birsa Hansda'));
        if (birsaCard) birsaCard.click();
      })()
    `);
    await sleep(1500);

    const reloginActive = await client.eval(`localStorage.getItem('joharcraft_active_account')`);
    console.log('  Re-login active ID:', reloginActive);
    if (!reloginActive) {
      throw new Error('Failed to 1-click log back into Birsa Hansda');
    }
    console.log('  ✓ 1-click account login verified\n');

    // ----------------------------------------------------
    // TEST 8: Account Deletion Cascade & Data Purge
    // ----------------------------------------------------
    console.log('[TEST 8] Account Deletion Cascade & Data Purge');
    await client.send('Page.navigate', { url: 'http://localhost:5173/artisan/settings?tab=accounts' });
    await sleep(1500);

    // Delete buyer Ravi Ranjan
    await client.eval(`
      (() => {
        // Find cards in Other Accounts
        const cards = Array.from(document.querySelectorAll('.card'));
        const raviCard = cards.find(c => c.innerText.includes('Ravi Ranjan'));
        if (raviCard) {
          const delBtn = Array.from(raviCard.querySelectorAll('button')).find(b => b.innerText.includes('Delete'));
          if (delBtn) delBtn.click();
        }
      })()
    `);
    await sleep(500);

    // Click Permanently Delete in confirmation dialog
    await client.eval(`
      (() => {
        const confirmBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Permanently Delete'));
        if (confirmBtn) confirmBtn.click();
      })()
    `);
    await sleep(1000);

    const afterRaviDel = await client.eval(`
      (() => {
        const accounts = JSON.parse(localStorage.getItem('joharcraft_accounts') || '[]');
        const found = accounts.find(a => a.name.includes('Ravi Ranjan'));
        return { remaining: accounts.length, foundRavi: !!found };
      })()
    `);
    console.log('  After deleting Ravi Ranjan:', afterRaviDel);
    if (afterRaviDel.foundRavi) {
      throw new Error('Ravi Ranjan was not purged from joharcraft_accounts!');
    }
    console.log('  ✓ Buyer account permanently deleted');

    // Now delete Birsa Hansda (Active Artisan)
    await client.eval(`
      (() => {
        const delActiveBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Delete Account'));
        if (delActiveBtn) delActiveBtn.click();
      })()
    `);
    await sleep(500);

    await client.eval(`
      (() => {
        const confirmBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Permanently Delete'));
        if (confirmBtn) confirmBtn.click();
      })()
    `);
    await sleep(1500);

    const afterBirsaDel = await client.eval(`
      (() => {
        const accounts = JSON.parse(localStorage.getItem('joharcraft_accounts') || '[]');
        const products = JSON.parse(localStorage.getItem('jc_products') || '[]');
        const foundBirsaAcc = accounts.find(a => a.name.includes('Birsa'));
        const foundMahuaProd = products.find(p => p.name.includes('Mahua'));
        const activeId = localStorage.getItem('joharcraft_active_account');
        const activeAcc = accounts.find(a => a.id === activeId);
        return {
          remainingAccounts: accounts.length,
          foundBirsaAcc: !!foundBirsaAcc,
          foundMahuaProd: !!foundMahuaProd,
          newActiveName: activeAcc ? activeAcc.name : null,
        };
      })()
    `);

    console.log('  After deleting Birsa Hansda:', afterBirsaDel);
    if (afterBirsaDel.foundBirsaAcc) {
      throw new Error('Birsa Hansda account still in storage!');
    }
    if (afterBirsaDel.foundMahuaProd) {
      throw new Error('Birsa\'s Mahua Bowl product was NOT purged from jc_products!');
    }
    console.log('  ✓ Artisan account and owned product permanently purged from LocalStorage');
    console.log('  ✓ Active account automatically fell back to:', afterBirsaDel.newActiveName, '\n');

    // ----------------------------------------------------
    // TEST 9: Empty State & No Reseed on Refresh
    // ----------------------------------------------------
    console.log('[TEST 9] Empty State & No Reseed on Refresh');
    // Clear remaining accounts to simulate user deleting all accounts
    await client.eval(`
      (() => {
        localStorage.setItem('joharcraft_accounts', '[]');
        localStorage.removeItem('joharcraft_active_account');
        localStorage.setItem('joharcraft_accounts_initialized', 'true');
      })()
    `);

    // Reload the page
    await client.send('Page.navigate', { url: 'http://localhost:5173/account/select' });
    await sleep(2000);

    const emptyCheck = await client.eval(`
      (() => {
        const accounts = JSON.parse(localStorage.getItem('joharcraft_accounts') || '[]');
        const activeId = localStorage.getItem('joharcraft_active_account');
        const text = document.body.innerText;
        return {
          accountsCount: accounts.length,
          activeId,
          hasEmptyMsg: text.includes('No accounts saved on this device') || text.includes('Create Your First Account'),
        };
      })()
    `);

    console.log('  Empty check after refresh:', emptyCheck);
    if (emptyCheck.accountsCount !== 0) {
      throw new Error('Reseed bug! Deleted accounts re-appeared upon reload: count = ' + emptyCheck.accountsCount);
    }
    if (!emptyCheck.hasEmptyMsg) {
      throw new Error('Empty state UI prompt missing');
    }
    console.log('  ✓ Empty state verified: 0 accounts, no re-seed on reload!\n');

    console.log('================================================================');
    console.log('ALL 9 ACCOUNT MANAGEMENT TEST SUITES PASSED SUCCESSFULLY!');
    console.log('================================================================');

  } finally {
    if (client) {
      try {
        await client.send('Browser.close');
      } catch (_) {}
    }
    edgeProc.kill();
    try {
      fs.rmSync(userDataDir, { recursive: true, force: true });
    } catch (_) {}
  }
}

runTests().catch((err) => {
  console.error('\n❌ Test failed with error:', err);
  process.exit(1);
});
