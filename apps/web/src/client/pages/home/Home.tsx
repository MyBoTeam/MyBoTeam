import { Lightbulb } from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import FloatingRobot from '@/components/common/robot/FloatingRobot';
import { Button } from '@/components/ui/button';
import { springs } from '@/utils/animations';
import { PlusMenu } from './components/PlusMenu';
import { TaskInputBar } from './components/TaskInputBar';
import { useHomePage } from './hooks/useHomePage';

export function HomePage() {
  const { t } = useTranslation('home');
  const navigate = useNavigate();
  const {
    prompt,
    setPrompt,
    showAllFavorites,
    setShowAllFavorites,
    attachments,
    attachmentError,
    setAttachments,
    workingDirectory,
    setWorkingDirectory,
    favoritesList,
    removeFavorite,
    isLoading,
    useCaseExamples,
    displayedFavorites,
    hasMoreFavorites,
    handleSubmit,
    handleOpenSpeechSettings,
    handleOpenModelSettings,
    handleExampleClick,
    handleSkillSelect,
    handleAttachFiles,
    handleOpenSettings,
    MAX_FILES,
  } = useHomePage();

  return (
    <div className="h-full flex relative overflow-hidden items-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springs.gentle, delay: 0.1 }}
        className="w-1/2 h-fit shrink-0 mx-auto"
      >
        <FloatingRobot />
      </motion.div>
      <div className="flex-1 overflow-y-auto p-6 pb-0">
        <div className="w-full max-w-[720px] mx-auto flex flex-col items-center gap-4">
          <div className="w-full mb-4">
            <motion.h1
              data-testid="home-title"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={springs.gentle}
              className="font-apparat text-[32px] tracking-[-0.015em] text-foreground w-full text-center"
            >
              {t('title')}
            </motion.h1>
            <motion.h2
              data-testid="home-sub-title"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={springs.gentle}
              className="font-apparat text-[18px] tracking-[-0.015em] text-foreground w-full text-center"
            >
              {t('sub_title')}
            </motion.h2>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springs.gentle, delay: 0.1 }}
            className="w-full"
          >
            <TaskInputBar
              value={prompt}
              onChange={setPrompt}
              onSubmit={handleSubmit}
              isLoading={isLoading}
              placeholder={t('inputPlaceholder')}
              typingPlaceholder={true}
              large={true}
              autoFocus={true}
              autoSubmitOnTranscription={false}
              onOpenSpeechSettings={handleOpenSpeechSettings}
              onOpenModelSettings={handleOpenModelSettings}
              hideModelWhenNoModel={true}
              attachments={attachments}
              attachmentError={attachmentError}
              onAttachmentsChange={setAttachments}
              toolbarLeft={
                <PlusMenu
                  onSkillSelect={handleSkillSelect}
                  onOpenSettings={handleOpenSettings}
                  onAttachFiles={handleAttachFiles}
                  onSelectFolder={setWorkingDirectory}
                  disabled={isLoading}
                  attachmentCount={attachments.length}
                  maxAttachments={MAX_FILES}
                />
              }
            />
            {workingDirectory && (
              <div className="flex items-center gap-1.5 mt-1.5 text-xs text-muted-foreground">
                <span className="truncate max-w-[400px]" title={workingDirectory}>
                  {t('selectedFolder.badge', { folder: workingDirectory })}
                </span>
                <button
                  type="button"
                  onClick={() => setWorkingDirectory(undefined)}
                  className="ml-1 hover:text-foreground transition-colors"
                  aria-label={t('selectedFolder.clearAriaLabel')}
                >
                  ✕
                </button>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      <div className="absolute bottom-4 right-6">
        <Button variant="default" size="sm" onClick={() => navigate('/examples')} className="gap-2">
          <Lightbulb className="h-4 w-4" />
          Examples
        </Button>
      </div>
    </div>
  );
}
