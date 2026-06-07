import { WarningCircle } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DefaultFallback, ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { ModelIndicator } from '@/components/ui/ModelIndicator';
import { useCreditsState } from '@/hooks/useCreditsState';
import { BrowserInstallModal } from './BrowserInstallModal';
import { ConversationCompleteFooter } from './ConversationCompleteFooter';
import { ConversationHeader } from './ConversationHeader';
import { ConversationView } from './ConversationView';
import { CreditExhaustedChatBanner } from './components/CreditExhaustedChatBanner';
import { DebugPanel } from './components/DebugPanel';
import { SpinningIcon } from './components/SpinningIcon';
import { isMyBoTeamCreditExhaustedError } from './conversation-utils';
import { FollowUpInput } from './FollowUpInput';
import { useExecutionPage } from './hooks/useExecutionPage';
import { QueuedEmptyState, QueuedWithMessages } from './QueuedState';

export default function ExecutionPage() {
  const s = useExecutionPage();
  const { t } = useTranslation('execution');
  const creditsState = useCreditsState();
  const { t: tCommon } = useTranslation('common');

  if (s.error) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <Card className="max-w-md w-full p-6 text-center">
          <WarningCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <p className="text-destructive mb-4">{s.error}</p>
          <Button onClick={() => s.navigate('/')}>{tCommon('buttons.goHome')}</Button>
        </Card>
      </div>
    );
  }

  if (!s.currentTask) {
    return (
      <div className="h-full flex items-center justify-center">
        <SpinningIcon className="h-8 w-8" />
      </div>
    );
  }

  const { scrollContainerRef, messagesEndRef } = s;

  return (
    <div className="h-full flex flex-col relative">
      <ConversationHeader prompt={s.currentTask.prompt} status={s.currentTask.status} />

      <BrowserInstallModal
        setupProgress={s.setupProgress}
        setupProgressTaskId={s.setupProgressTaskId}
        taskId={s.id}
        setupDownloadStep={s.setupDownloadStep}
      />

      {s.currentTask.status === 'queued' && s.currentTask.messages.length === 0 && (
        <QueuedEmptyState />
      )}

      {s.currentTask.status === 'queued' && s.currentTask.messages.length > 0 && (
        <QueuedWithMessages messages={s.currentTask.messages} messagesEndRef={messagesEndRef} />
      )}

      {s.currentTask.status !== 'queued' && (
        <ErrorBoundary
          fallback={(error, reset) => (
            <div className="flex-1 flex items-center justify-center p-6">
              <DefaultFallback error={error} reset={reset} compact={false} />
            </div>
          )}
        >
          <ConversationView
            currentTask={s.currentTask}
            taskId={s.id}
            scrollContainerRef={scrollContainerRef}
            messagesEndRef={messagesEndRef}
            onScroll={s.handleScroll}
            isAtBottom={s.isAtBottom}
            scrollToBottom={s.scrollToBottom}
            hasSession={s.hasSession}
            isConnectorAuthPause={s.isConnectorAuthPause}
            taskActionLabel={s.taskActionLabel}
            taskActionPendingLabel={s.taskActionPendingLabel}
            onTaskAction={s.handleTaskAction}
            isTaskActionRunning={s.isTaskActionRunning}
            taskActionError={s.taskActionError}
            isLoading={s.isLoading}
            permissionRequest={s.permissionRequest}
            onPermissionResponse={s.handlePermissionResponse}
            currentTool={s.currentTool}
            currentToolInput={s.currentToolInput}
            startupStage={s.startupStage}
            startupStageTaskId={s.startupStageTaskId}
            elapsedTime={s.elapsedTime}
            todos={s.todos}
            todosTaskId={s.todosTaskId}
          />
        </ErrorBoundary>
      )}
      <div className="flex w-full justify-center py-4 items-center gap-2">
        {s.currentTask.status === 'running' && !s.permissionRequest && (
          <div className="flex-1 flex-shrink-0 px-6 py-4">
            <div className="mx-auto">
              <div className="flex items-center gap-2 rounded-xl border border-border px-3 py-2.5">
                <input
                  placeholder={t('agentWorking')}
                  disabled
                  className="flex-1 bg-transparent text-sm text-muted-foreground placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed"
                />
                <ModelIndicator isRunning={true} onOpenSettings={s.handleOpenModelSettings} />
                <div className="w-px h-6 bg-border flex-shrink-0" />
                <button
                  onClick={s.interruptTask}
                  title={t('stopAgent')}
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-[#e54d2e] text-white hover:bg-[#d4442a] transition-colors shrink-0"
                  data-testid="execution-stop-button"
                >
                  <span className="block h-2.5 w-2.5 rounded-[2px] bg-white" />
                </button>
              </div>
            </div>
          </div>
        )}

        {s.canFollowUp && (
          <FollowUpInput
            followUp={s.followUp}
            setFollowUp={s.setFollowUp}
            isFollowUpOverLimit={s.isFollowUpOverLimit}
            attachments={s.attachments}
            setAttachments={s.setAttachments}
            removeAttachment={s.removeAttachment}
            isDragging={s.isDragging}
            setDragCounter={s.setDragCounter}
            setIsDragging={s.setIsDragging}
            handleDrop={s.handleDrop}
            handlePickFiles={s.handlePickFiles}
            speechInput={s.speechInput}
            slashCommand={s.slashCommand}
            followUpInputRef={s.followUpInputRef}
            handleFollowUp={s.handleFollowUp}
            isLoading={s.isLoading}
            currentTask={s.currentTask}
            hasSession={s.hasSession}
            onOpenSettings={(tab) => {
              s.setSettingsInitialTab(tab);
              s.setShowSettingsDialog(true);
            }}
            onOpenModelSettings={s.handleOpenModelSettings}
            onOpenSpeechSettings={s.handleOpenSpeechSettings}
          />
        )}

        {(creditsState.isCreditsBlocked ||
          (s.currentTask?.status === 'failed' &&
            isMyBoTeamCreditExhaustedError(s.currentTask?.result?.error))) && (
          <CreditExhaustedChatBanner
            variant="exhausted"
            resetDate={creditsState.usage?.resetsAt ?? ''}
            onConnectProvider={() => {
              s.setSettingsInitialTab('providers');
              s.setShowSettingsDialog(true);
            }}
          />
        )}

        {['completed', 'interrupted', 'failed', 'cancelled'].includes(
          s.currentTask?.status ?? '',
        ) &&
          !s.isConnectorAuthPause && (
            <ConversationCompleteFooter
              taskId={s.currentTask.id}
              onStartNewTask={() => s.navigate('/')}
            />
          )}

        {s.debugModeEnabled && (
          <DebugPanel
            debugLogs={s.debugLogs}
            taskId={s.id}
            onClearLogs={() => s.setDebugLogs([])}
            onBugReport={s.handleBugReport}
            bugReporting={s.bugReporting}
            bugReportSaved={s.bugReportSaved}
            onRepeatTask={s.handleRepeatTask}
            repeatingTask={s.repeatingTask}
            isRunning={s.currentTask?.status === 'running'}
          />
        )}
      </div>
    </div>
  );
}
