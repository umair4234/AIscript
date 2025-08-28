import React, { useState } from 'react';

interface ManualOutlineInputProps {
    onSubmit: (text: string) => void;
    error: string | null;
}

const ManualOutlineInput: React.FC<ManualOutlineInputProps> = ({ onSubmit, error }) => {
    const [text, setText] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(text);
    };

    const placeholderText = `Paste or write your outline here. It should follow this format:

Video Title: [Your Title]
Total Word Count: [e.g., 15000]

Chapter 1
Summary: [A 2-3 line summary of the chapter.]
Word Count: [e.g., 900]

Chapter 2
Summary: [Another summary.]
Word Count: [e.g., 1100]

...and so on.
`;

    return (
        <div className="w-full max-w-2xl bg-surface p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-bold text-primary mb-2">Enter Outline Manually</h3>
            <p className="text-on-surface-secondary text-sm mb-4">
                The AI failed to generate a valid outline. You can paste your own outline below to continue.
            </p>
            <form onSubmit={handleSubmit}>
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder={placeholderText}
                    rows={15}
                    className="w-full bg-brand-bg border border-gray-600 rounded-md p-3 text-on-surface focus:ring-primary focus:border-primary font-mono text-sm"
                />
                <button
                    type="submit"
                    disabled={!text.trim()}
                    className="w-full mt-4 bg-secondary text-on-primary font-bold py-3 rounded-lg hover:bg-opacity-90 transition-opacity disabled:bg-gray-600"
                >
                    Parse & Use This Outline
                </button>
            </form>
        </div>
    );
};

export default ManualOutlineInput;
