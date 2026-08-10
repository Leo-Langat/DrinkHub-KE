import { test, expect } from '@playwright/test';

test.describe('Customer QR Ordering & Waiter Claim E2E Workflow', () => {
  test('Customer scans QR menu, adds Tusker Lager, completes 18+ verification and checkout', async ({ page }) => {
    // 1. Visit venue QR menu page
    await page.goto('/v/alchemist-westlands/t/2');
    await expect(page.locator('h1')).toContainText('The Alchemist Westlands');

    // 2. Add drink to cart
    await page.click('text="+ Add"');
    await expect(page.locator('text="View Cart & Checkout"')).toBeVisible();

    // 3. Open cart sheet
    await page.click('text="View Cart & Checkout"');
    await expect(page.locator('text="Your Shopping Cart"')).toBeVisible();

    // 4. Click proceed to checkout -> opens 18+ Age verification modal
    await page.click('text="Proceed to Age Verification & Payment"');
    await expect(page.locator('text="Checkout & Payment"')).toBeVisible();

    // 5. Confirm age verification checkbox
    const confirmButton = page.locator('button:has-text("Confirm Order & Process Payment")');
    await expect(confirmButton).toBeDisabled();

    await page.check('input[type="checkbox"]');
    await expect(confirmButton).toBeEnabled();

    // 6. Submit payment
    await confirmButton.click();
    await expect(page.locator('text="Payment Request Submitted!"')).toBeVisible();
  });
});
