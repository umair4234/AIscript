import React, { useState, useEffect, useRef } from 'react';
import * as storage from '../services/storageService';
import { Prompt, PromptSection } from '../types';
import { ArrowLeftIcon, PlusIcon, GripVerticalIcon, TrashIcon, PencilIcon, CopyIcon, CheckIcon, XIcon } from './Icons';

// =================================================================================
// Component: PromptModal
// =================================================================================
const PromptModal = ({
  isOpen,
  onClose,
  onSave,
  prompt: initialPrompt,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (title: string, text: string) => void;
  prompt: Prompt | null;
}) => {
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');

  useEffect(() => {
    setTitle(initialPrompt?.title || '');
    setText(initialPrompt?.text || '');
  }, [initialPrompt]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (title.trim() && text.trim()) {
      onSave(title.trim(), text.trim());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-lg shadow-2xl p-6 w-full max-w-2xl border border-gray-700 flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
          <h2 className="text-2xl font-bold text-on-surface">{initialPrompt ? 'Edit Prompt' : 'Add New Prompt'}</h2>
          <button onClick={onClose} className="text-on-surface-secondary hover:text-white"><XIcon /></button>
        </div>
        <div className="flex-grow flex flex-col gap-4 min-h-0">
          <div>
            <label htmlFor="prompt-title" className="block text-sm font-medium text-on-surface-secondary mb-1">Prompt Title</label>
            <input
              id="prompt-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-brand-bg border border-gray-600 rounded-md p-2 text-on-surface focus:ring-primary focus:border-primary"
              placeholder="e.g., HOA Story Outline Prompt"
            />
          </div>
          <div className="flex-grow flex flex-col">
            <label htmlFor="prompt-text" className="block text-sm font-medium text-on-surface-secondary mb-1">Prompt Text</label>
            <textarea
              id="prompt-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full h-full flex-grow bg-brand-bg border border-gray-600 rounded-md p-3 text-on-surface focus:ring-primary focus:border-primary font-mono text-sm"
              placeholder="Paste your detailed prompt here..."
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end flex-shrink-0">
          <button onClick={handleSave} disabled={!title.trim() || !text.trim()} className="px-6 py-2 bg-primary text-on-primary font-bold rounded-lg hover:opacity-90 disabled:bg-gray-600">
            Save Prompt
          </button>
        </div>
      </div>
    </div>
  );
};

// =================================================================================
// Component: PromptsPage
// =================================================================================
const PromptsPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [sections, setSections] = useState<PromptSection[]>([]);
  const [newSectionName, setNewSectionName] = useState('');
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    sectionId: string | null;
    prompt: Prompt | null;
  }>({ isOpen: false, sectionId: null, prompt: null });
  const [copiedPromptId, setCopiedPromptId] = useState<string | null>(null);

  const draggedItem = useRef<any>(null);
  const dragOverItem = useRef<any>(null);

  useEffect(() => {
    setSections(storage.getPromptSections());
  }, []);

  const handleSaveToStorage = (updatedSections: PromptSection[]) => {
    setSections(updatedSections);
    storage.savePromptSections(updatedSections);
  };

  const handleAddSection = () => {
    if (newSectionName.trim()) {
      const newSection: PromptSection = {
        id: `section_${Date.now()}`,
        name: newSectionName.trim(),
        prompts: [],
      };
      handleSaveToStorage([...sections, newSection]);
      setNewSectionName('');
    }
  };
  
  const handleDeleteSection = (sectionId: string) => {
    if (window.confirm('Are you sure you want to delete this entire section and all its prompts?')) {
        handleSaveToStorage(sections.filter(s => s.id !== sectionId));
    }
  };
  
  const handleUpdateSectionName = (sectionId: string, newName: string) => {
    if (newName.trim()) {
        const updatedSections = sections.map(s => s.id === sectionId ? { ...s, name: newName.trim() } : s);
        handleSaveToStorage(updatedSections);
    }
  };

  const handleSavePrompt = (title: string, text: string) => {
    if (!modalState.sectionId) return;

    const targetSection = sections.find(s => s.id === modalState.sectionId);
    if (!targetSection) return;

    if (modalState.prompt) { // Editing existing prompt
      const updatedPrompts = targetSection.prompts.map(p =>
        p.id === modalState.prompt!.id ? { ...p, title, text } : p
      );
      const updatedSections = sections.map(s => s.id === modalState.sectionId ? {...s, prompts: updatedPrompts} : s);
      handleSaveToStorage(updatedSections);
    } else { // Adding new prompt
      const newPrompt: Prompt = { id: `prompt_${Date.now()}`, title, text };
      const updatedSections = sections.map(s => s.id === modalState.sectionId ? {...s, prompts: [...s.prompts, newPrompt]} : s);
      handleSaveToStorage(updatedSections);
    }
  };
  
  const handleDeletePrompt = (sectionId: string, promptId: string) => {
     if (window.confirm('Are you sure you want to delete this prompt?')) {
        const updatedSections = sections.map(s => {
            if (s.id === sectionId) {
                return {...s, prompts: s.prompts.filter(p => p.id !== promptId)};
            }
            return s;
        });
        handleSaveToStorage(updatedSections);
    }
  };

  const handleCopyPrompt = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPromptId(id);
    setTimeout(() => setCopiedPromptId(null), 3000);
  };
  
  const handleDragSort = () => {
    if (!draggedItem.current || !dragOverItem.current) return;
    const { type: draggedType, sectionId: fromSectionId, promptId: fromPromptId } = draggedItem.current;
    const { type: dragOverType, sectionId: toSectionId, promptId: toPromptId } = dragOverItem.current;

    const sectionsCopy = JSON.parse(JSON.stringify(sections));

    // Scenario 1: Reordering Sections
    if (draggedType === 'section' && dragOverType === 'section' && fromSectionId !== toSectionId) {
        const draggedIndex = sections.findIndex(s => s.id === fromSectionId);
        const targetIndex = sections.findIndex(s => s.id === toSectionId);
        const [removed] = sectionsCopy.splice(draggedIndex, 1);
        sectionsCopy.splice(targetIndex, 0, removed);
        handleSaveToStorage(sectionsCopy);
    }

    // Scenario 2: Reordering Prompts
    if (draggedType === 'prompt' && dragOverType === 'prompt' && fromPromptId !== toPromptId) {
        const fromSection = sectionsCopy.find(s => s.id === fromSectionId);
        const toSection = sectionsCopy.find(s => s.id === toSectionId);
        if (!fromSection || !toSection) return;

        const draggedIndex = fromSection.prompts.findIndex(p => p.id === fromPromptId);
        const [removed] = fromSection.prompts.splice(draggedIndex, 1);

        const targetIndex = toSection.prompts.findIndex(p => p.id === toPromptId);
        toSection.prompts.splice(targetIndex, 0, removed);
        handleSaveToStorage(sectionsCopy);
    }

    draggedItem.current = null;
    dragOverItem.current = null;
  };
  
  return (
    <div className="w-full flex-grow flex flex-col p-6 md:p-8 overflow-y-auto">
      <header className="flex items-center mb-6 flex-shrink-0">
        <button onClick={onBack} className="p-2 mr-4 bg-surface hover:bg-primary-variant rounded-full">
          <ArrowLeftIcon />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-primary">Prompt Library</h1>
          <p className="text-on-surface-secondary">Organize, create, and reuse your prompts.</p>
        </div>
      </header>
      
      <div className="bg-surface p-4 rounded-lg flex gap-2 mb-6">
        <input
            type="text"
            value={newSectionName}
            onChange={(e) => setNewSectionName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddSection()}
            className="flex-grow bg-brand-bg border border-gray-600 rounded-md p-2 text-on-surface focus:ring-primary focus:border-primary"
            placeholder="Enter new category name (e.g., HOA Stories)"
        />
        <button onClick={handleAddSection} className="px-4 py-2 bg-secondary text-on-primary font-bold rounded-lg hover:bg-opacity-90">
            Add Category
        </button>
      </div>

      <div className="space-y-6">
        {sections.map(section => (
          <div 
            key={section.id}
            draggable
            onDragStart={() => draggedItem.current = { type: 'section', sectionId: section.id }}
            onDragEnter={() => dragOverItem.current = { type: 'section', sectionId: section.id }}
            onDragEnd={handleDragSort}
            onDragOver={(e) => e.preventDefault()}
            className="bg-surface p-4 rounded-lg"
          >
            <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2 flex-grow">
                    <span className="cursor-grab text-on-surface-secondary"><GripVerticalIcon/></span>
                    <input
                        type="text"
                        value={section.name}
                        onChange={(e) => handleUpdateSectionName(section.id, e.target.value)}
                        className="text-xl font-bold text-primary bg-transparent border-none p-1 focus:ring-1 focus:ring-primary rounded-md"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setModalState({isOpen: true, sectionId: section.id, prompt: null})} className="flex items-center gap-1 text-sm bg-primary text-on-primary font-semibold py-1 px-3 rounded-lg hover:bg-opacity-90">
                        <PlusIcon /> Add Prompt
                    </button>
                    <button onClick={() => handleDeleteSection(section.id)} className="p-1 text-gray-500 hover:text-error">
                        <TrashIcon />
                    </button>
                </div>
            </div>
            <div className="space-y-3">
              {section.prompts.map(prompt => (
                <div 
                  key={prompt.id}
                  draggable
                  onDragStart={() => draggedItem.current = { type: 'prompt', sectionId: section.id, promptId: prompt.id }}
                  onDragEnter={() => dragOverItem.current = { type: 'prompt', sectionId: section.id, promptId: prompt.id }}
                  onDragEnd={handleDragSort}
                  onDragOver={(e) => e.preventDefault()}
                  className="bg-brand-bg p-3 rounded-md border border-gray-700 flex items-start gap-2 group"
                >
                  <span className="cursor-grab text-on-surface-secondary mt-1"><GripVerticalIcon/></span>
                  <div className="flex-grow">
                    <p className="font-semibold text-on-surface">{prompt.title}</p>
                    <p className="text-sm text-on-surface-secondary whitespace-pre-wrap line-clamp-2">{prompt.text.split('\n').slice(0, 2).join('\n')}</p>
                  </div>
                  <div className="flex-shrink-0 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleCopyPrompt(prompt.text, prompt.id)} className="p-1 text-gray-400 hover:text-primary">
                        {copiedPromptId === prompt.id ? <CheckIcon /> : <CopyIcon />}
                    </button>
                    <button onClick={() => setModalState({isOpen: true, sectionId: section.id, prompt})} className="p-1 text-gray-400 hover:text-secondary">
                        <PencilIcon />
                    </button>
                     <button onClick={() => handleDeletePrompt(section.id, prompt.id)} className="p-1 text-gray-400 hover:text-error">
                        <TrashIcon />
                    </button>
                  </div>
                </div>
              ))}
              {section.prompts.length === 0 && (
                <p className="text-sm text-center text-on-surface-secondary py-4">No prompts in this section. Click "Add Prompt" to start.</p>
              )}
            </div>
          </div>
        ))}
      </div>

       <PromptModal
            isOpen={modalState.isOpen}
            onClose={() => setModalState({isOpen: false, sectionId: null, prompt: null})}
            onSave={handleSavePrompt}
            prompt={modalState.prompt}
        />
    </div>
  );
};

export default PromptsPage;
