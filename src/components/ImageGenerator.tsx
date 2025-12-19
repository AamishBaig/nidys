import React, { useState, useContext, ChangeEvent, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import Modal from './Modal';
import { MediaManagerContext } from '../context/MediaManagerContext';
import { SpinnerIcon, SparklesIcon, PhotoIcon } from './Icons';

interface ImageGeneratorProps {
    isOpen: boolean;
    onClose: () => void;
    saveToFolderId: string;
}

const ImageGenerator: React.FC<ImageGeneratorProps> = ({ isOpen, onClose, saveToFolderId }) => {
    const { addItem } = useContext(MediaManagerContext);
    const [prompt, setPrompt] = useState('');
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [imageCue, setImageCue] = useState<string | null>(null);
    const [isHighRes, setIsHighRes] = useState(false);
    const [isTransparent, setIsTransparent] = useState(false);
    const [needsApiKey, setNeedsApiKey] = useState(false);
    const imageCueInputRef = useRef<HTMLInputElement>(null);

    const handleSelectKey = async () => {
        if ((window as any).aistudio) {
            await (window as any).aistudio.openSelectKey();
            setNeedsApiKey(false);
            setError(null);
        }
    };

    const handleGenerate = async () => {
        if (!prompt && !imageCue) {
            setError('Please provide a text prompt or an image cue.');
            return;
        }

        // Check for API key if High Res is selected
        if (isHighRes && (window as any).aistudio) {
            const hasKey = await (window as any).aistudio.hasSelectedApiKey();
            if (!hasKey) {
                setNeedsApiKey(true);
                return;
            }
        }

        setIsLoading(true);
        setError(null);
        setGeneratedImage(null);

        // Enhance prompt for transparency if selected
        let finalPrompt = prompt;
        if (isTransparent) {
            finalPrompt += " . The image must have a transparent background. The subject should be isolated on a transparent alpha layer. Do not include any background context.";
        }

        try {
            // Always create new instance to get latest key
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            if (isHighRes) {
                 const model = 'gemini-3-pro-image-preview';
                 const parts: any[] = [];
                 
                 if (imageCue) {
                     const base64Data = imageCue.split(',')[1];
                     const mimeType = imageCue.split(';')[0].split(':')[1] || 'image/jpeg';
                     parts.push({ inlineData: { data: base64Data, mimeType } });
                 }
                 
                 // Always push text part if prompt exists or if we need to convey transparency instructions
                 if (finalPrompt) {
                     parts.push({ text: finalPrompt });
                 }

                 const response = await ai.models.generateContent({
                     model,
                     contents: { parts },
                     config: {
                         imageConfig: {
                             imageSize: '2K',
                             aspectRatio: '1:1'
                         }
                     }
                 });

                 let foundImage = false;
                 if (response.candidates?.[0]?.content?.parts) {
                     for (const part of response.candidates[0].content.parts) {
                         if (part.inlineData) {
                             setGeneratedImage(`data:image/png;base64,${part.inlineData.data}`);
                             foundImage = true;
                             break;
                         }
                     }
                 }
                 
                 if (!foundImage) {
                    const textPart = response.candidates?.[0]?.content?.parts?.find(p => p.text);
                    throw new Error(textPart?.text || 'No image generated.');
                 }

            } else {
                // Standard Resolution Logic
                const model = imageCue ? 'gemini-2.5-flash-image' : 'imagen-4.0-generate-001';
                
                if (model === 'imagen-4.0-generate-001') {
                    const response = await ai.models.generateImages({
                        model,
                        prompt: finalPrompt,
                        config: { numberOfImages: 1 }
                    });
                    if (response.generatedImages && response.generatedImages.length > 0) {
                         setGeneratedImage(`data:image/png;base64,${response.generatedImages[0].image.imageBytes}`);
                    } else {
                         setError('Image generation failed. The prompt may have been blocked.');
                    }
                } else { // gemini-2.5-flash-image for image cue
                    if (!imageCue) {
                        setError('An image cue is required for this model.');
                        setIsLoading(false);
                        return;
                    }
                    const imagePart = { inlineData: { data: imageCue.split(',')[1], mimeType: 'image/jpeg' } };
                    const textPart = { text: finalPrompt };
                    
                    const response = await ai.models.generateContent({
                        model,
                        contents: { parts: [imagePart, textPart] },
                    });
                    
                    const imageResponsePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
                    if (imageResponsePart?.inlineData) {
                        setGeneratedImage(`data:image/png;base64,${imageResponsePart.inlineData.data}`);
                    } else {
                        setError('Image generation failed. The prompt may have been blocked.');
                    }
                }
            }
        } catch (e: any) {
            console.error(e);
            let msg = 'An error occurred while generating the image.';
            if (e.message) msg = e.message;
            if (msg.includes('Requested entity was not found')) {
                setNeedsApiKey(true);
                msg = 'Please select a valid paid API key for high resolution.';
            }
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleSave = () => {
        if (!generatedImage) return;
        const newFile = {
            id: `file-${Date.now()}`,
            name: prompt.slice(0, 20) || 'AI Generated Image',
            type: 'file' as const,
            mimeType: 'image/png'
        };
        addItem(newFile, generatedImage, saveToFolderId);
        onClose();
    };

    const handleImageCueUpload = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => setImageCue(event.target?.result as string);
            reader.readAsDataURL(file);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="AI Image Generator" className="w-full max-w-2xl">
            <div className="space-y-4">
                 <div className="flex space-x-4">
                    <div 
                        onClick={() => imageCueInputRef.current?.click()}
                        className="w-32 h-32 flex-shrink-0 border-2 border-dashed border-gray-600 rounded-md flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 overflow-hidden"
                    >
                        {imageCue ? <img src={imageCue} alt="Cue" className="w-full h-full object-cover" /> : <><PhotoIcon className="w-8 h-8 text-gray-500" /><span className="text-xs text-gray-500 mt-1">Image Cue</span></>}
                        <input type="file" ref={imageCueInputRef} onChange={handleImageCueUpload} className="hidden" accept="image/*" />
                    </div>
                    <div className="flex-grow flex flex-col space-y-2">
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Describe the image you want to create..."
                            className="w-full flex-grow bg-gray-700 border border-gray-600 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none h-24"
                        />
                        <div className="flex flex-col space-y-2">
                            <div className="flex items-center space-x-2">
                                <input 
                                    type="checkbox" 
                                    id="highRes" 
                                    checked={isHighRes} 
                                    onChange={(e) => setIsHighRes(e.target.checked)}
                                    className="w-4 h-4 rounded border-gray-600 text-indigo-600 focus:ring-indigo-500 bg-gray-700"
                                />
                                <label htmlFor="highRes" className="text-sm text-gray-300 select-none">
                                    High Resolution (2K) <span className="text-xs text-gray-500 ml-1">(Requires Paid API Key)</span>
                                </label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <input 
                                    type="checkbox" 
                                    id="transparentBg" 
                                    checked={isTransparent} 
                                    onChange={(e) => setIsTransparent(e.target.checked)}
                                    className="w-4 h-4 rounded border-gray-600 text-indigo-600 focus:ring-indigo-500 bg-gray-700"
                                />
                                <label htmlFor="transparentBg" className="text-sm text-gray-300 select-none">
                                    Transparent Background (Foreground)
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                {needsApiKey ? (
                    <button 
                        onClick={handleSelectKey}
                        className="w-full flex justify-center items-center space-x-2 bg-amber-600 font-bold py-2 px-4 rounded-lg hover:bg-amber-700 transition-colors"
                    >
                        <span>Select Paid API Key to Continue</span>
                    </button>
                ) : (
                    <button onClick={handleGenerate} disabled={isLoading} className="w-full flex justify-center items-center space-x-2 bg-indigo-600 font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-800 transition-colors">
                        {isLoading ? <SpinnerIcon className="w-5 h-5" /> : <SparklesIcon className="w-5 h-5" />}
                        <span>{isLoading ? 'Generating...' : 'Generate Image'}</span>
                    </button>
                )}
                
                {error && <p className="text-red-400 text-sm text-center bg-red-900/20 p-2 rounded">{error}</p>}
                
                <div className="w-full aspect-square bg-gray-900 rounded-lg flex items-center justify-center overflow-hidden border border-gray-700" style={{
                    backgroundImage: isTransparent ? 'conic-gradient(#374151 25%, #1f2937 25%, #1f2937 50%, #374151 50%, #374151 75%, #1f2937 75%, #1f2937 100%)' : 'none',
                    backgroundSize: '20px 20px'
                }}>
                    {generatedImage ? (
                        <img src={generatedImage} alt="Generated" className="max-w-full max-h-full object-contain" />
                    ) : (
                        <div className="text-gray-600 flex flex-col items-center">
                            <PhotoIcon className="w-12 h-12 mb-2 opacity-50" />
                            <span className="text-sm">Image preview will appear here</span>
                        </div>
                    )}
                </div>

                {generatedImage && (
                    <button onClick={handleSave} className="w-full bg-green-600 font-bold py-2 px-4 rounded-lg hover:bg-green-700 transition-colors">
                        Save to Media Library
                    </button>
                )}
            </div>
        </Modal>
    );
};

export default ImageGenerator;