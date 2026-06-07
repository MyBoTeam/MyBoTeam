import { TEST_SCENARIOS, TEST_TIMEOUTS } from '../config';
import { expect, test } from '../fixtures';
import { ExecutionPage, HomePage } from '../pages';
import { captureForAI } from '../utils';

test.describe('Favorites', () => {
  test('should show favorite toggle on completed task', async ({ window }) => {
    const homePage = new HomePage(window);
    const executionPage = new ExecutionPage(window);

    await window.waitForLoadState('domcontentloaded');

    await homePage.enterTask(TEST_SCENARIOS.SUCCESS.keyword);
    await homePage.submitTask();
    await window.waitForURL(/.*#\/execution.*/, { timeout: TEST_TIMEOUTS.NAVIGATION });
    await executionPage.waitForComplete();

    await captureForAI(window, 'favorites-toggle', 'before-favorite', [
      'Task is completed',
      'Favorite toggle button is visible',
      'Star icon is not filled (not yet favorited)',
    ]);

    await expect(executionPage.favoriteToggle.first()).toBeVisible();
    await expect(executionPage.favoriteToggle.first()).toHaveAttribute('aria-pressed', 'false');
  });

  test('should toggle favorite on completed task', async ({ window }) => {
    const homePage = new HomePage(window);
    const executionPage = new ExecutionPage(window);

    await window.waitForLoadState('domcontentloaded');

    await homePage.enterTask(TEST_SCENARIOS.SUCCESS.keyword);
    await homePage.submitTask();
    await window.waitForURL(/.*#\/execution.*/, { timeout: TEST_TIMEOUTS.NAVIGATION });
    await executionPage.waitForComplete();

    await executionPage.favoriteToggle.first().click();

    await captureForAI(window, 'favorites-toggle', 'after-favorite', [
      'Star icon is now filled (favorited)',
      'aria-pressed is true',
    ]);

    await expect(executionPage.favoriteToggle.first()).toHaveAttribute('aria-pressed', 'true');
  });

  test('should unfavorite a previously favorited task', async ({ window }) => {
    const homePage = new HomePage(window);
    const executionPage = new ExecutionPage(window);

    await window.waitForLoadState('domcontentloaded');

    await homePage.enterTask(TEST_SCENARIOS.SUCCESS.keyword);
    await homePage.submitTask();
    await window.waitForURL(/.*#\/execution.*/, { timeout: TEST_TIMEOUTS.NAVIGATION });
    await executionPage.waitForComplete();

    await executionPage.favoriteToggle.first().click();
    await expect(executionPage.favoriteToggle.first()).toHaveAttribute('aria-pressed', 'true');

    await executionPage.favoriteToggle.first().click();

    await captureForAI(window, 'favorites-toggle', 'after-unfavorite', [
      'Star icon is no longer filled',
      'aria-pressed is false',
    ]);

    await expect(executionPage.favoriteToggle.first()).toHaveAttribute('aria-pressed', 'false');

    const buttonText = await executionPage.favoriteToggle.first().textContent();
    expect(buttonText).toContain('Add to favorites');
  });

  test('should display favorites section on Home after favoriting', async ({ window }) => {
    const homePage = new HomePage(window);
    const executionPage = new ExecutionPage(window);

    await window.waitForLoadState('domcontentloaded');

    await homePage.enterTask(TEST_SCENARIOS.SUCCESS.keyword);
    await homePage.submitTask();
    await window.waitForURL(/.*#\/execution.*/, { timeout: TEST_TIMEOUTS.NAVIGATION });
    await executionPage.waitForComplete();

    await executionPage.favoriteToggle.first().click();
    await expect(executionPage.favoriteToggle.first()).toHaveAttribute('aria-pressed', 'true');

    await executionPage.startNewTaskButton.click();
    await window.waitForURL(/.*#\/$/, { timeout: TEST_TIMEOUTS.NAVIGATION });

    await captureForAI(window, 'favorites-home', 'favorites-visible', [
      'Favorites section is visible on Home page',
      'At least one favorite item is displayed',
    ]);

    await expect(homePage.favoritesSection).toBeVisible({ timeout: TEST_TIMEOUTS.NAVIGATION });
    const itemCount = await homePage.favoriteItems.count();
    expect(itemCount).toBeGreaterThan(0);
  });

  test('should pre-fill prompt when clicking a favorite on Home', async ({ window }) => {
    const homePage = new HomePage(window);
    const executionPage = new ExecutionPage(window);

    await window.waitForLoadState('domcontentloaded');

    const expectedPrompt = TEST_SCENARIOS.SUCCESS.keyword;

    await homePage.enterTask(expectedPrompt);
    await homePage.submitTask();
    await window.waitForURL(/.*#\/execution.*/, { timeout: TEST_TIMEOUTS.NAVIGATION });
    await executionPage.waitForComplete();

    await executionPage.favoriteToggle.first().click();
    await expect(executionPage.favoriteToggle.first()).toHaveAttribute('aria-pressed', 'true');

    await executionPage.startNewTaskButton.click();
    await window.waitForURL(/.*#\/$/, { timeout: TEST_TIMEOUTS.NAVIGATION });

    await expect(homePage.favoritesSection).toBeVisible({ timeout: TEST_TIMEOUTS.NAVIGATION });

    await homePage.favoriteItems.first().click();

    await expect(homePage.taskInput).toHaveValue(expectedPrompt, {
      timeout: TEST_TIMEOUTS.NAVIGATION,
    });

    await captureForAI(window, 'favorites-home', 'prompt-prefilled', [
      'Task input is pre-filled with favorite prompt',
      'Submit button is enabled',
    ]);

    await expect(homePage.submitButton).toBeEnabled();
  });

  test('should favorite an interrupted task', async ({ window }) => {
    const homePage = new HomePage(window);
    const executionPage = new ExecutionPage(window);

    await window.waitForLoadState('domcontentloaded');

    await homePage.enterTask(TEST_SCENARIOS.INTERRUPTED.keyword);
    await homePage.submitTask();
    await window.waitForURL(/.*#\/execution.*/, { timeout: TEST_TIMEOUTS.NAVIGATION });
    await executionPage.waitForComplete();

    await expect(executionPage.favoriteToggle.first()).toBeVisible();
    await expect(executionPage.favoriteToggle.first()).toHaveAttribute('aria-pressed', 'false');

    await executionPage.favoriteToggle.first().click();
    await expect(executionPage.favoriteToggle.first()).toHaveAttribute('aria-pressed', 'true');

    await executionPage.startNewTaskButton.click();
    await window.waitForURL(/.*#\/$/, { timeout: TEST_TIMEOUTS.NAVIGATION });

    await expect(homePage.favoritesSection).toBeVisible({ timeout: TEST_TIMEOUTS.NAVIGATION });
    await expect(homePage.favoriteItems.first()).toBeVisible();
  });
});
