import { chromium } from "playwright";

const loginFMTSelector = 'input[name="loginfmt"]';
const submitSelector = 'input[type="submit"]';
const switchToCredPickerSelector = "#idA_PWD_SwitchToCredPicker";
const switchToRemoteNGCSelector = "#idA_PWD_SwitchToRemoteNGC";
const switchToPasswordSelector = "#idA_PWD_SwitchToPassword";
const otcLoginLinkSelector = "#otcLoginLink";
const otpPasswordSelector = "#idTxtBx_OTC_Password";
const proofConfirmationTextSelector = "#proofConfirmationText";
const button9Selector = "#idSIButton9";
const tableCellsSelector = ".table-cell.text-left.content";

export async function requestOTP(email, backupEmail) {
  return new Promise(async function (resolve, reject) {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();
    page.setDefaultTimeout(5000);
    try {
      await page.goto("https://login.live.com/login.srf");

      await page.fill(loginFMTSelector, email);
      await page.click(submitSelector);
      await page.waitForTimeout(1000);

      const switchToCredPickerExists = await page.$(switchToCredPickerSelector);
      const switchToRemoteNGCExists = await page.$(switchToRemoteNGCSelector);
      const otcLoginLinkExists = await page.$(otcLoginLinkSelector);
      const otcPasswordExists = await page.$(otpPasswordSelector);

      if (!switchToCredPickerExists && !switchToRemoteNGCExists && !otcLoginLinkExists && !otcPasswordExists) {
        return resolve({ success: false, email: null });
      }

      if (otcLoginLinkExists) {
        await page.click(otcLoginLinkSelector);
        await page.waitForTimeout(1000);

        return resolve(await checkBackupEmail(page, email, backupEmail, true));
      }

      if (switchToCredPickerExists) {
        await page.click(switchToCredPickerSelector);
        await page.waitForTimeout(1000);

        return resolve(await checkEmail(page, email, backupEmail));
      }

      if (switchToRemoteNGCExists) {
        await page.click(switchToRemoteNGCSelector);
      }

      if (otcPasswordExists) {
        const switchToPasswordExists = await page.$(switchToPasswordSelector);
        const switchToCredPickerExists = await page.$(switchToCredPickerSelector);
        if (switchToPasswordExists) {
          await page.click(switchToPasswordSelector);
          await page.waitForTimeout(1000);
          await page.click(otcLoginLinkSelector);
          await page.waitForTimeout(1000);

          return resolve(await checkBackupEmail(page, email, backupEmail, true));
        } else if (switchToCredPickerExists) {
          await page.click(switchToCredPickerExists);
          await page.waitForTimeout(1000);

          return resolve(await checkEmail(page, email, backupEmail));
        }
      }

      await browser.close();
    } catch (error) {
      console.error(error);
    } finally {
      await browser.close();
    }
  });
}

async function checkEmail(page, email, backupEmail) {
  return new Promise(async (resolve, reject) => {
    const emailTableCells = await page.$$(tableCellsSelector);
    if (emailTableCells) {
      for (const emailTableCell of emailTableCells) {
        const emailText = (await emailTableCell.textContent()).replace("\u200e", "");
        const emailMatch = /E-mail\s+(\S+)/i.exec(emailText) || /Email\s+(\S+)/i.exec(emailText);

        if (emailMatch) {
          const emailTxt = emailMatch[1];
          if (!emailTxt.includes("*")) {
            await emailTableCell.click();
            return resolve({ success: true, email: emailTxt });
          } else {
            if (!backupEmail) {
              return resolve({ success: false, email: emailTxt });
            }

            await emailTableCell.click();
            await page.waitForTimeout(1000);

            return resolve(await checkBackupEmail(page, email, backupEmail));
          }
        }
      }
    }
    return resolve({ success: false, email: null });
  });
}

async function checkBackupEmail(page, email, backupEmail, checkOnly) {
  return new Promise(async (resolve, reject) => {
    const proofConfirmationTextExists = await page.$(proofConfirmationTextSelector);

    if (proofConfirmationTextExists && backupEmail) {
      await page.fill(proofConfirmationTextSelector, backupEmail);
      await page.click(button9Selector);

      return resolve({ success: true, email: backupEmail });
    } else {
      return resolve({ success: checkOnly ? true : false, email: email });
    }
  });
}
