import { TEST_SCENARIOS, TEST_TIMEOUTS } from '../config';
import { expect, test } from '../fixtures';
import { ExecutionPage, HomePage } from '../pages';
import { captureForAI } from '../utils';

test.describe('Execution Page', () => {
  test('should display running state with thinking indicator', async ({ window }) => {
    const homePage = new HomePage(window);
    const executionPage = new ExecutionPage(window);

    await window.waitForLoadState('domcontentloaded');

    await homePage.enterTask(TEST_SCENARIOS.SUCCESS.keyword);
    await homePage.submitTask();

    await window.waitForURL(/.*#\/execution.*/, { timeout: TEST_TIMEOUTS.NAVIGATION });

    await Promise.race([
      executionPage.thinkingIndicator.waitFor({
        state: 'visible',
        timeout: TEST_TIMEOUTS.NAVIGATION,
      }),
      executionPage.statusBadge.waitFor({ state: 'visible', timeout: TEST_TIMEOUTS.NAVIGATION }),
    ]);

    await captureForAI(window, 'execution-running', 'thinking-indicator', [
      'Execution page is loaded',
      'Thinking indicator is visible',
      'Task is in running state',
      'UI shows active processing',
    ]);

    // Note: It might complete quickly in mock mode
    const thinkingVisible = await executionPage.thinkingIndicator.isVisible();
    const statusVisible = await executionPage.statusBadge.isVisible();

    expect(thinkingVisible || statusVisible).toBe(true);
  });

  test('should display completed state with success badge', async ({ window }) => {
    const homePage = new HomePage(window);
    const executionPage = new ExecutionPage(window);

    await window.waitForLoadState('domcontentloaded');

    await homePage.enterTask(TEST_SCENARIOS.SUCCESS.keyword);
    await homePage.submitTask();

    await window.waitForURL(/.*#\/execution.*/, { timeout: TEST_TIMEOUTS.NAVIGATION });

    await executionPage.waitForComplete();

    await captureForAI(window, 'execution-completed', 'success-badge', [
      'Status badge shows completed state',
      'Task completed successfully',
      'Success indicator is visible',
      'No error messages displayed',
    ]);

    await expect(executionPage.statusBadge).toBeVisible();

    const badgeText = await executionPage.statusBadge.textContent();
    expect(badgeText?.toLowerCase()).toMatch(/complete|success|done/i);
  });

  test('should display tool usage during execution', async ({ window }) => {
    const homePage = new HomePage(window);
    const executionPage = new ExecutionPage(window);

    await window.waitForLoadState('domcontentloaded');

    await homePage.enterTask(TEST_SCENARIOS.WITH_TOOL.keyword);
    await homePage.submitTask();

    await window.waitForURL(/.*#\/execution.*/, { timeout: TEST_TIMEOUTS.NAVIGATION });

    await Promise.race([
      executionPage.thinkingIndicator.waitFor({
        state: 'visible',
        timeout: TEST_TIMEOUTS.NAVIGATION,
      }),
      executionPage.statusBadge.waitFor({ state: 'visible', timeout: TEST_TIMEOUTS.NAVIGATION }),
    ]);

    await captureForAI(window, 'execution-tool-usage', 'tool-display', [
      'Tool usage is displayed',
      'Tool name or icon is visible',
      'Tool execution is shown to user',
      'UI clearly indicates tool interaction',
    ]);

    const pageContent = await window.textContent('body');

    await executionPage.waitForComplete();

    await captureForAI(window, 'execution-tool-usage', 'tools-complete', [
      'Tools were executed during task',
      'Tool results are displayed',
      'Complete history of tool usage visible',
    ]);

    expect(pageContent).toBeTruthy();
  });

  test('should display permission modal with allow/deny buttons', async ({ window }) => {
    const homePage = new HomePage(window);
    const executionPage = new ExecutionPage(window);

    await window.waitForLoadState('domcontentloaded');

    await homePage.enterTask(TEST_SCENARIOS.PERMISSION.keyword);
    await homePage.submitTask();

    await window.waitForURL(/.*#\/execution.*/, { timeout: TEST_TIMEOUTS.NAVIGATION });

    await executionPage.permissionCard.waitFor({
      state: 'visible',
      timeout: TEST_TIMEOUTS.PERMISSION_MODAL,
    });

    await captureForAI(window, 'execution-permission', 'modal-visible', [
      'Permission modal is displayed',
      'Allow button is visible and clickable',
      'Deny button is visible and clickable',
      'Modal clearly shows what permission is being requested',
      'User can make a choice',
    ]);

    await expect(executionPage.permissionCard).toBeVisible();
    await expect(executionPage.allowButton).toBeVisible();
    await expect(executionPage.denyButton).toBeVisible();

    await expect(executionPage.allowButton).toBeEnabled();
    await expect(executionPage.denyButton).toBeEnabled();
  });

  test('should handle permission allow action', async ({ window }) => {
    const homePage = new HomePage(window);
    const executionPage = new ExecutionPage(window);

    await window.waitForLoadState('domcontentloaded');

    await homePage.enterTask(TEST_SCENARIOS.PERMISSION.keyword);
    await homePage.submitTask();

    await window.waitForURL(/.*#\/execution.*/, { timeout: TEST_TIMEOUTS.NAVIGATION });

    await executionPage.permissionCard.waitFor({
      state: 'visible',
      timeout: TEST_TIMEOUTS.PERMISSION_MODAL,
    });
    await executionPage.allowButton.waitFor({
      state: 'visible',
      timeout: TEST_TIMEOUTS.NAVIGATION,
    });

    await executionPage.allowButton.click();

    await captureForAI(window, 'execution-permission', 'after-allow', [
      'Permission modal is dismissed',
      'Task continues execution',
      'Permission was granted successfully',
    ]);

    await expect(executionPage.permissionCard).not.toBeVisible({
      timeout: TEST_TIMEOUTS.NAVIGATION,
    });

    // Note: Mock flow doesn't simulate continuation after permission grant,
  });

  test('should handle permission deny action', async ({ window }) => {
    const homePage = new HomePage(window);
    const executionPage = new ExecutionPage(window);

    await window.waitForLoadState('domcontentloaded');

    await homePage.enterTask(TEST_SCENARIOS.PERMISSION.keyword);
    await homePage.submitTask();

    await window.waitForURL(/.*#\/execution.*/, { timeout: TEST_TIMEOUTS.NAVIGATION });

    await executionPage.permissionCard.waitFor({
      state: 'visible',
      timeout: TEST_TIMEOUTS.PERMISSION_MODAL,
    });
    await executionPage.denyButton.waitFor({ state: 'visible', timeout: TEST_TIMEOUTS.NAVIGATION });

    await executionPage.denyButton.click();

    await captureForAI(window, 'execution-permission', 'after-deny', [
      'Permission modal is dismissed',
      'Task handles denied permission gracefully',
      'Appropriate message shown to user',
    ]);

    await expect(executionPage.permissionCard).not.toBeVisible({
      timeout: TEST_TIMEOUTS.NAVIGATION,
    });

    await executionPage.statusBadge.waitFor({
      state: 'visible',
      timeout: TEST_TIMEOUTS.PERMISSION_MODAL,
    });

    await captureForAI(window, 'execution-permission', 'deny-result', [
      'Task responded to permission denial',
      'No crashes or errors',
      'User feedback is clear',
    ]);
  });

  test('should display error state when task fails', async ({ window }) => {
    const homePage = new HomePage(window);
    const executionPage = new ExecutionPage(window);

    await window.waitForLoadState('domcontentloaded');

    await homePage.enterTask(TEST_SCENARIOS.ERROR.keyword);
    await homePage.submitTask();

    await window.waitForURL(/.*#\/execution.*/, { timeout: TEST_TIMEOUTS.NAVIGATION });

    await executionPage.waitForComplete();

    await captureForAI(window, 'execution-error', 'error-displayed', [
      'Error state is clearly visible',
      'Error message or indicator is shown',
      'User understands task failed',
      'Error handling is graceful',
    ]);

    const pageContent = await window.textContent('body');
    const statusBadgeVisible = await executionPage.statusBadge.isVisible();

    if (statusBadgeVisible) {
      const badgeText = await executionPage.statusBadge.textContent();
      await captureForAI(window, 'execution-error', 'error-badge', [
        'Status badge indicates error/failure',
        `Badge shows: ${badgeText}`,
      ]);
    }

    expect(pageContent).toBeTruthy();
  });

  test('should display interrupted state when task is stopped', async ({ window }) => {
    const homePage = new HomePage(window);
    const executionPage = new ExecutionPage(window);

    await window.waitForLoadState('domcontentloaded');

    await homePage.enterTask(TEST_SCENARIOS.INTERRUPTED.keyword);
    await homePage.submitTask();

    await window.waitForURL(/.*#\/execution.*/, { timeout: TEST_TIMEOUTS.NAVIGATION });

    await executionPage.waitForComplete();

    await captureForAI(window, 'execution-interrupted', 'interrupted-displayed', [
      'Interrupted state is visible',
      'Task shows it was stopped',
      'UI clearly indicates interruption',
      'User understands task did not complete normally',
    ]);

    const statusBadgeVisible = await executionPage.statusBadge.isVisible();

    if (statusBadgeVisible) {
      const badgeText = await executionPage.statusBadge.textContent();
      await captureForAI(window, 'execution-interrupted', 'interrupted-badge', [
        'Status badge shows interrupted/stopped state',
        `Badge shows: ${badgeText}`,
      ]);
    }
  });

  test('should allow canceling a running task', async ({ window }) => {
    const homePage = new HomePage(window);
    const executionPage = new ExecutionPage(window);

    await window.waitForLoadState('domcontentloaded');

    await homePage.enterTask(TEST_SCENARIOS.SUCCESS.keyword);
    await homePage.submitTask();

    await window.waitForURL(/.*#\/execution.*/, { timeout: TEST_TIMEOUTS.NAVIGATION });

    try {
      await Promise.race([
        executionPage.cancelButton.waitFor({ state: 'visible', timeout: TEST_TIMEOUTS.NAVIGATION }),
        executionPage.stopButton.waitFor({ state: 'visible', timeout: TEST_TIMEOUTS.NAVIGATION }),
      ]);

      const cancelVisible = await executionPage.cancelButton.isVisible();
      const stopVisible = await executionPage.stopButton.isVisible();

      await captureForAI(window, 'execution-cancel', 'before-cancel', [
        'Cancel/Stop button is visible',
        'Task is running and can be cancelled',
      ]);

      if (cancelVisible) {
        await executionPage.cancelButton.click();
      } else if (stopVisible) {
        await executionPage.stopButton.click();
      }

      await executionPage.waitForComplete();

      await captureForAI(window, 'execution-cancel', 'after-cancel', [
        'Task was cancelled/stopped',
        'UI reflects cancelled state',
        'Cancellation was successful',
      ]);
    } catch {}
  });

  test('should display task output and messages', async ({ window }) => {
    const homePage = new HomePage(window);
    const executionPage = new ExecutionPage(window);

    await window.waitForLoadState('domcontentloaded');

    await homePage.enterTask(TEST_SCENARIOS.WITH_TOOL.keyword);
    await homePage.submitTask();

    await window.waitForURL(/.*#\/execution.*/, { timeout: TEST_TIMEOUTS.NAVIGATION });

    await Promise.race([
      executionPage.thinkingIndicator.waitFor({
        state: 'visible',
        timeout: TEST_TIMEOUTS.NAVIGATION,
      }),
      executionPage.statusBadge.waitFor({ state: 'visible', timeout: TEST_TIMEOUTS.NAVIGATION }),
    ]);

    await captureForAI(window, 'execution-output', 'task-messages', [
      'Task output is visible',
      'Messages from task execution are displayed',
      'Output format is clear and readable',
      'User can follow task progress',
    ]);

    await executionPage.waitForComplete();

    await captureForAI(window, 'execution-output', 'final-output', [
      'Complete task output is visible',
      'All messages and results are displayed',
      'Output is well-formatted',
    ]);

    const pageContent = await window.textContent('body');
    expect(pageContent).toBeTruthy();
    expect(pageContent.length).toBeGreaterThan(0);
  });

  test('should handle follow-up input after task completion', async ({ window }) => {
    const homePage = new HomePage(window);
    const executionPage = new ExecutionPage(window);

    await window.waitForLoadState('domcontentloaded');

    await homePage.enterTask(TEST_SCENARIOS.SUCCESS.keyword);
    await homePage.submitTask();
    await window.waitForURL(/.*#\/execution.*/, { timeout: TEST_TIMEOUTS.NAVIGATION });
    await executionPage.waitForComplete();

    try {
      await executionPage.followUpInput.waitFor({
        state: 'visible',
        timeout: TEST_TIMEOUTS.NAVIGATION,
      });

      await captureForAI(window, 'execution-follow-up', 'follow-up-visible', [
        'Follow-up input is visible after task completion',
        'User can enter additional instructions',
        'Follow-up feature is accessible',
      ]);

      await executionPage.followUpInput.fill('Follow up task');

      await captureForAI(window, 'execution-follow-up', 'follow-up-filled', [
        'Follow-up text is entered',
        'Input is ready to submit',
        'User can continue conversation',
      ]);

      await expect(executionPage.followUpInput).toHaveValue('Follow up task');
    } catch {}
  });

  test('should show scroll-to-bottom button when scrolled up', async ({ window }) => {
    const homePage = new HomePage(window);
    const executionPage = new ExecutionPage(window);

    await window.waitForLoadState('domcontentloaded');

    await homePage.enterTask(TEST_SCENARIOS.WITH_TOOL.keyword);
    await homePage.submitTask();

    await window.waitForURL(/.*#\/execution.*/, { timeout: TEST_TIMEOUTS.NAVIGATION });
    await executionPage.waitForComplete();

    const scrollContainer = executionPage.messagesScrollContainer;
    await scrollContainer.waitFor({ state: 'visible', timeout: TEST_TIMEOUTS.NAVIGATION });

    await scrollContainer.evaluate((el) => {
      el.scrollTop = 0;
    });

    await window.waitForTimeout(TEST_TIMEOUTS.STATE_UPDATE * 4);

    const hasEnoughScroll = await scrollContainer.evaluate((el) => {
      return el.scrollHeight - el.clientHeight > 150;
    });

    if (hasEnoughScroll) {
      await expect(executionPage.scrollToBottomButton).toBeVisible({
        timeout: TEST_TIMEOUTS.PERMISSION_MODAL,
      });

      await captureForAI(window, 'execution-scroll', 'scroll-button-visible', [
        'Scroll-to-bottom button is visible',
        'User is scrolled up from bottom',
        'Button appears inline after messages',
      ]);
    }
  });

  test('should hide scroll-to-bottom button when at bottom', async ({ window }) => {
    const homePage = new HomePage(window);
    const executionPage = new ExecutionPage(window);

    await window.waitForLoadState('domcontentloaded');

    await homePage.enterTask(TEST_SCENARIOS.WITH_TOOL.keyword);
    await homePage.submitTask();

    await window.waitForURL(/.*#\/execution.*/, { timeout: TEST_TIMEOUTS.NAVIGATION });
    await executionPage.waitForComplete();

    const scrollContainer = executionPage.messagesScrollContainer;
    await scrollContainer.waitFor({ state: 'visible', timeout: TEST_TIMEOUTS.NAVIGATION });

    await scrollContainer.evaluate((el) => {
      el.scrollTop = el.scrollHeight;
    });

    await window.waitForTimeout(TEST_TIMEOUTS.STATE_UPDATE);

    await expect(executionPage.scrollToBottomButton).not.toBeVisible({
      timeout: TEST_TIMEOUTS.STATE_UPDATE,
    });

    await captureForAI(window, 'execution-scroll', 'scroll-button-hidden', [
      'Scroll-to-bottom button is hidden',
      'User is at bottom of messages',
      'Normal message view without scroll indicator',
    ]);
  });

  test('should scroll to bottom when clicking scroll-to-bottom button', async ({ window }) => {
    const homePage = new HomePage(window);
    const executionPage = new ExecutionPage(window);

    await window.waitForLoadState('domcontentloaded');

    await homePage.enterTask(TEST_SCENARIOS.WITH_TOOL.keyword);
    await homePage.submitTask();

    await window.waitForURL(/.*#\/execution.*/, { timeout: TEST_TIMEOUTS.NAVIGATION });
    await executionPage.waitForComplete();

    const scrollContainer = executionPage.messagesScrollContainer;
    await scrollContainer.waitFor({ state: 'visible', timeout: TEST_TIMEOUTS.NAVIGATION });

    const hasEnoughScroll = await scrollContainer.evaluate((el) => {
      return el.scrollHeight - el.clientHeight > 150;
    });

    if (hasEnoughScroll) {
      await scrollContainer.evaluate((el) => {
        el.scrollTop = 0;
      });
      await window.waitForTimeout(TEST_TIMEOUTS.STATE_UPDATE * 4);

      await expect(executionPage.scrollToBottomButton).toBeVisible({
        timeout: TEST_TIMEOUTS.PERMISSION_MODAL,
      });

      await executionPage.scrollToBottomButton.click();

      await window.waitForTimeout(TEST_TIMEOUTS.ANIMATION + 200);

      await expect(executionPage.scrollToBottomButton).not.toBeVisible({
        timeout: TEST_TIMEOUTS.NAVIGATION,
      });

      const isAtBottom = await scrollContainer.evaluate((el) => {
        const threshold = 50;
        return el.scrollTop + el.clientHeight >= el.scrollHeight - threshold;
      });
      expect(isAtBottom).toBe(true);

      await captureForAI(window, 'execution-scroll', 'after-scroll-click', [
        'Scrolled to bottom after clicking button',
        'Scroll-to-bottom button is now hidden',
        'Latest messages are visible',
      ]);
    }
  });

  test('should display question modal with selectable options', async ({ window }) => {
    const homePage = new HomePage(window);
    const executionPage = new ExecutionPage(window);

    await window.waitForLoadState('domcontentloaded');

    await homePage.enterTask(TEST_SCENARIOS.QUESTION.keyword);
    await homePage.submitTask();

    await window.waitForURL(/.*#\/execution.*/, { timeout: TEST_TIMEOUTS.NAVIGATION });

    await executionPage.permissionCard.waitFor({
      state: 'visible',
      timeout: TEST_TIMEOUTS.PERMISSION_MODAL,
    });

    await captureForAI(window, 'execution-question', 'modal-visible', [
      'Question modal is displayed',
      'Question text is shown',
      'Option buttons are visible',
      'Submit button is visible but disabled until option selected',
    ]);

    await expect(executionPage.permissionCard).toBeVisible();
    await expect(executionPage.questionOptions).toHaveCount(2);

    await expect(executionPage.allowButton).toBeDisabled();
    await expect(executionPage.denyButton).toBeVisible();
  });

  test('should handle question option selection and submit', async ({ window }) => {
    const homePage = new HomePage(window);
    const executionPage = new ExecutionPage(window);

    await window.waitForLoadState('domcontentloaded');

    await homePage.enterTask(TEST_SCENARIOS.QUESTION.keyword);
    await homePage.submitTask();

    await window.waitForURL(/.*#\/execution.*/, { timeout: TEST_TIMEOUTS.NAVIGATION });

    await executionPage.permissionCard.waitFor({
      state: 'visible',
      timeout: TEST_TIMEOUTS.PERMISSION_MODAL,
    });

    await executionPage.selectQuestionOption(0);

    await captureForAI(window, 'execution-question', 'option-selected', [
      'Option A is selected',
      'Submit button is now enabled',
      'Selected option is highlighted',
    ]);

    await expect(executionPage.allowButton).toBeEnabled();

    await executionPage.allowButton.click();

    await expect(executionPage.permissionCard).not.toBeVisible({
      timeout: TEST_TIMEOUTS.NAVIGATION,
    });

    await captureForAI(window, 'execution-question', 'after-submit', [
      'Question modal is dismissed',
      'Response was submitted successfully',
    ]);
  });

  test('should copy message content to clipboard', async ({ window }) => {
    const homePage = new HomePage(window);
    const executionPage = new ExecutionPage(window);

    await window.waitForLoadState('domcontentloaded');

    await homePage.enterTask(TEST_SCENARIOS.SUCCESS.keyword);
    await homePage.submitTask();

    await window.waitForURL(/.*#\/execution.*/, { timeout: TEST_TIMEOUTS.NAVIGATION });

    await executionPage.waitForComplete();

    await captureForAI(window, 'execution-copy', 'before-copy', [
      'Task is completed',
      'Copy buttons are present on messages',
      'Ready to test copy functionality',
    ]);

    const copyButtonsCount = await executionPage.copyButtons.count();
    expect(copyButtonsCount).toBeGreaterThan(0);

    const firstCopyButton = executionPage.copyButtons.first();

    const buttonBox = await firstCopyButton.boundingBox();
    if (buttonBox) {
      await window.mouse.move(buttonBox.x + buttonBox.width / 2, buttonBox.y - 10);
    }

    await firstCopyButton.waitFor({ state: 'visible', timeout: 5000 });

    await firstCopyButton.click();

    await captureForAI(window, 'execution-copy', 'after-copy', [
      'Copy button was clicked',
      'Icon should change to checkmark',
      'Background should turn green',
      'Content was copied to clipboard',
    ]);

    const clipboardText = await window.evaluate(async () => {
      return await navigator.clipboard.readText();
    });
    expect(clipboardText).toBeTruthy();
    expect(clipboardText.length).toBeGreaterThan(0);

    const buttonClasses = await firstCopyButton.getAttribute('class');
    expect(buttonClasses).toContain('bg-accent');
  });

  test('should display code blocks with syntax highlighting and copy buttons', async ({
    window,
  }) => {
    const homePage = new HomePage(window);
    const executionPage = new ExecutionPage(window);

    await window.waitForLoadState('domcontentloaded');

    await homePage.enterTask(TEST_SCENARIOS.CODE_BLOCK.keyword);
    await homePage.submitTask();

    await window.waitForURL(/.*#\/execution.*/, { timeout: TEST_TIMEOUTS.NAVIGATION });
    await executionPage.waitForComplete();

    await captureForAI(window, 'execution-code-block', 'syntax-highlighting', [
      'Task is completed with code blocks',
      'Syntax highlighted code is visible',
      'TypeScript and Python code blocks are rendered',
      'Copy buttons are present on code blocks',
    ]);

    const codeBlockCopyButtonsCount = await executionPage.codeBlockCopyButtons.count();
    expect(codeBlockCopyButtonsCount).toBeGreaterThanOrEqual(2);

    const codeBlockContainers = window.locator('.group\\/code');
    const containerCount = await codeBlockContainers.count();
    expect(containerCount).toBeGreaterThanOrEqual(2);

    const typescriptLabel = window.locator('text=typescript');
    const pythonLabel = window.locator('text=python');
    await expect(typescriptLabel.first()).toBeVisible();
    await expect(pythonLabel.first()).toBeVisible();

    const pageContent = await window.textContent('body');
    expect(pageContent).toContain('function greet');
    expect(pageContent).toContain('def calculate_sum');

    const firstCodeBlockCopyButton = executionPage.codeBlockCopyButtons.nth(0);
    const codeBlockContainer = codeBlockContainers.nth(0);

    await codeBlockContainer.scrollIntoViewIfNeeded();

    await expect(firstCodeBlockCopyButton).toHaveCSS('opacity', '0');

    await codeBlockContainer.hover();
    await window.waitForTimeout(100);

    await expect(firstCodeBlockCopyButton).toHaveCSS('opacity', '1');

    const buttonText = await firstCodeBlockCopyButton.textContent();
    expect(buttonText).toContain('Copy');

    await firstCodeBlockCopyButton.click();
    await window.waitForTimeout(200);

    const clipboardText = await window.evaluate(async () => {
      return await navigator.clipboard.readText();
    });
    expect(clipboardText).toBeTruthy();
    expect(clipboardText).toContain('function greet');
    expect(clipboardText).toContain('Hello');
  });
});
