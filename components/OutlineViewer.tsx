import React, { useState, useEffect } from 'react';
import type { ScriptOutline } from '../types';
import { ChevronDownIcon, ChevronUpIcon, CopyIcon, CheckIcon } from './Icons';

interface OutlineViewerProps {
  outline: ScriptOutline | null;
  rawOutlineText: string;
  onApprove?: () => void;
  onSaveEditedOutline: (newText: string) => void;
  isGenerating?: boolean;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const OutlineViewer: React.FC<OutlineViewerProps> = ({ outline, rawOutlineText, onApprove, onSaveEditedOutline, isGenerating, isCollapsed, onToggleCollapse }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(rawOutlineText);
  const [hasCopied, setHasCopied] = useState(false);

  useEffect(() => {
    setEditText(rawOutlineText);
  }, [rawOutlineText]);
  
  if (!outline) {
    return null; // Don't show anything if there's no outline yet
  }
  
  const handleSave = () => {
    onSaveEditedOutline(editText);
    setIsEditing(false);
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(rawOutlineText);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };

  const header = (
    <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => !isEditing && onToggleCollapse()}>
            <h2 className="text-xl font-bold text-primary">Script Outline</h2>
            <button className="text-secondary p-1">
                {isCollapsed ? <ChevronDownIcon /> : <ChevronUpIcon />}
            </button>
        </div>
        <div className="flex items-center gap-2">
            <button onClick={handleCopy} className="text-on-surface-secondary hover:text-primary transition-colors p-1" aria-label="Copy outline">
                {hasCopied ? <CheckIcon /> : <CopyIcon />}
            </button>
            {!isEditing && onApprove && (
              <button
                onClick={(e) => {
                    e.stopPropagation();
                    onApprove();
                }}
                disabled={isGenerating}
                className="px-4 py-2 bg-secondary text-on-primary font-bold rounded-lg hover:bg-opacity-90 transition-opacity disabled:bg-gray-600 text-sm"
              >
                Approve & Gen. Hooks
              </button>
            )}
            <button onClick={() => setIsEditing(!isEditing)} className="text-sm px-3 py-2 bg-surface hover:bg-gray-700 rounded-md">
                {isEditing ? 'Cancel' : 'Edit'}
            </button>
        </div>
    </div>
  );

  const content = (
    <div className="mt-2">
      <div className="bg-brand-bg p-4 rounded-md mt-2 border border-gray-700">
        <h3 className="text-lg font-semibold text-on-surface">{outline.title}</h3>
        <p className="text-sm text-on-surface-secondary">Total Word Count: {outline.totalWordCount.toLocaleString()}</p>
      </div>
      <div className="space-y-3 pr-2 mt-2 max-h-64 overflow-y-auto">
        {outline.chapters.map((chapter) => (
          <div key={chapter.chapter} className="bg-brand-bg p-3 rounded-md border border-gray-700">
            <h4 className="font-bold text-secondary">Chapter {chapter.chapter}</h4>
            <p className="text-sm text-on-surface-secondary mb-1">~{chapter.wordCount} words</p>
            <p className="text-on-surface text-base">{chapter.summary}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const editor = (
     <div className="mt-4 flex flex-col">
        <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="w-full bg-brand-bg border border-gray-600 rounded-md p-2 text-on-surface focus:ring-primary focus:border-primary font-mono text-sm"
            rows={15}
        />
        <button onClick={handleSave} className="mt-2 w-full bg-secondary text-on-primary font-bold py-2 rounded-lg hover:bg-opacity-90">
            Parse & Save Changes
        </button>
     </div>
  );

  return (
      <div>
          {header}
          {!isCollapsed && (isEditing ? editor : content)}
      </div>
  )
};

export default OutlineViewer;