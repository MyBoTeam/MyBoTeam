import { TEST_SCENARIOS, TEST_TIMEOUTS } from '../config';
import { expect, test } from '../fixtures';
import { HomePage } from '../pages';
import { captureForAI } from '../utils';

test.describe('Home Page', () => {
  test('should load home page with title', async ({ window }) => {
    const homePage = new HomePage(window);

    await captureForAI(window, 'home-page-load', 'initial-load', [
      'Title "What will you myboteam today?" is visible',
      'Page layout is correct',
      'All UI elements are rendered',
    ]);

    await expect(homePage.title).toBeVisible();
    await expect(homePage.title).toHaveText('What will you myboteam today?');
  });

  test('should display task input and submit button', async ({ window }) => {
    const homePage = new HomePage(window);

    await captureForAI(window, 'home-page-input', 'task-input-visible', [
      'Task input textarea is visible',
      'Submit button is visible',
      'Input area is ready for user interaction',
    ]);

    await expect(homePage.taskInput).toBeVisible();
    await expect(homePage.submitButton).toBeVisible();
    await expect(homePage.taskInput).toBeEnabled();

    await expect(homePage.submitButton).toBeDisabled();
  });

  test('should allow typing in task input', async ({ window }) => {
    const homePage = new HomePage(window);

    const testTask = 'Write a hello world program';
    await homePage.enterTask(testTask);

    await captureForAI(window, 'home-page-input', 'task-input-filled', [
      'Task input contains typed text',
      'Text is clearly visible',
      'Submit button is enabled with text',
    ]);

    await expect(homePage.taskInput).toHaveValue(testTask);

    await expect(homePage.submitButton).toBeEnabled();
  });

  test('should display example cards', async ({ window }) => {
    const homePage = new HomePage(window);

    await captureForAI(window, 'home-page-examples', 'example-cards-visible', [
      'At least 3 example cards are visible',
      'Example cards are properly styled',
      'Cards show task examples to users',
    ]);

    const exampleCard0 = homePage.getExampleCard(0);
    const exampleCard1 = homePage.getExampleCard(1);
    const exampleCard2 = homePage.getExampleCard(2);

    await expect(exampleCard0).toBeVisible();
    await expect(exampleCard1).toBeVisible();
    await expect(exampleCard2).toBeVisible();
  });

  test('should fill input when clicking an example card', async ({ window }) => {
    const homePage = new HomePage(window);

    const exampleCard0 = homePage.getExampleCard(0);
    await exampleCard0.click();

    await window.waitForFunction(
      () => {
        const input = document.querySelector(
          '[data-testid="task-input-textarea"]',
        ) as HTMLTextAreaElement;
        return input && input.value.length > 0;
      },
      null,
      { timeout: TEST_TIMEOUTS.NAVIGATION },
    );

    await captureForAI(window, 'home-page-examples', 'example-card-clicked', [
      'Task input is filled with example text',
      'Input value matches the example card content',
      'User can now submit the pre-filled task',
    ]);

    const inputValue = await homePage.taskInput.inputValue();
    expect(inputValue.length).toBeGreaterThan(0);
  });

  test('should navigate to execution page when submitting a task', async ({ window }) => {
    const homePage = new HomePage(window);

    await homePage.enterTask(TEST_SCENARIOS.SUCCESS.keyword);

    await expect(homePage.submitButton).toBeEnabled();

    await captureForAI(window, 'home-page-submit', 'before-submit', [
      'Task is entered in input field',
      'Submit button is ready to click',
    ]);

    await homePage.submitTask();

    await window.waitForURL(/.*#\/execution.*/, { timeout: TEST_TIMEOUTS.NAVIGATION });

    await captureForAI(window, 'home-page-submit', 'after-submit-navigation', [
      'URL changed to execution page',
      'Navigation was successful',
      'Execution page is loading',
    ]);

    expect(window.url()).toContain('#/execution');
  });

  test('should handle empty input - submit disabled', async ({ window }) => {
    const homePage = new HomePage(window);

    await captureForAI(window, 'home-page-validation', 'empty-input', [
      'Task input is empty',
      'Submit button is disabled',
      'User cannot submit an empty task',
    ]);

    await expect(homePage.submitButton).toBeDisabled();
  });

  test('should support multi-line task input', async ({ window }) => {
    const homePage = new HomePage(window);

    const multiLineTask = 'Line 1\nLine 2\nLine 3';
    await homePage.enterTask(multiLineTask);

    await captureForAI(window, 'home-page-input', 'multi-line-task', [
      'Task input supports multiple lines',
      'All lines are visible in the textarea',
      'Textarea expands to show content',
    ]);

    await expect(homePage.taskInput).toHaveValue(multiLineTask);
  });
});
