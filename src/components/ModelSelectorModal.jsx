import React, { useState } from 'react';
import { 
  X, 
  Search, 
  Sparkles, 
  ChevronRight 
} from 'lucide-react';
import { ALL_MODELS, CATEGORIES, getModelById } from '../models/nvidiaModels';

export default function ModelSelectorModal({
  isOpen,
  onClose,
  activeModelId,
  onSelectModel,
  initialCategory = 'All',
}) {
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [customModelInput, setCustomModelInput] = useState('');

  // Automatically sync category when opened for a specific workspace
  React.useEffect(() => {
    if (isOpen) {
      setActiveCategory(initialCategory || 'All');
      setSearchQuery('');
    }
  }, [isOpen, initialCategory]);

  if (!isOpen) return null;

  const filteredModels = ALL_MODELS.filter(model => {
    let matchesCategory = true;
    const catLower = activeCategory.toLowerCase();

    if (activeCategory === '⚡ Ultra-Fast' || activeCategory === 'Ultra Fast') {
      matchesCategory = 
        model.id === 'auto/best-fast' || 
        model.category === 'Fast' || 
        (model.badge && (
          model.badge.toLowerCase().includes('fast') || 
          model.badge.toLowerCase().includes('instant') || 
          model.badge.toLowerCase().includes('tok/s') ||
          model.badge.toLowerCase().includes('sub-50ms') ||
          model.badge.toLowerCase().includes('lightning')
        ));
    } else if (activeCategory === 'Free Models') {
      matchesCategory = !!model.isFree || model.id.includes(':free') || model.id.includes('free');
    } else if (activeCategory === 'Chat') {
      matchesCategory = 
        model.category === 'Chat' || 
        model.category === 'General Chat' || 
        model.category === 'Fast' ||
        model.id === 'auto' || 
        model.id.includes('claude') ||
        model.id.includes('gemini') ||
        model.id.includes('chat') || 
        model.id.includes('vision-instruct') || 
        model.id.includes('lightning') ||
        (model.description && model.description.toLowerCase().includes('conversation'));
    } else if (activeCategory === 'Academics') {
      matchesCategory = 
        model.category === 'Academics' || 
        model.id === 'auto' ||
        model.id === 'auto/best-free' ||
        model.id.includes('claude') || 
        model.id.includes('sonnet') || 
        model.id.includes('gemma') || 
        model.id.includes('gemini') || 
        model.id.includes('gpt') ||
        (model.description && (
          model.description.toLowerCase().includes('academic') || 
          model.description.toLowerCase().includes('assignment') || 
          model.description.toLowerCase().includes('scholarly') ||
          model.description.toLowerCase().includes('research') ||
          model.description.toLowerCase().includes('writing')
        ));
    } else if (activeCategory === 'Reasoning') {
      matchesCategory = 
        model.category === 'Reasoning' || 
        model.supportsThinking || 
        model.id === 'auto' ||
        model.id.includes('r1') || 
        model.id.includes('thinking') || 
        model.id.includes('deepseek') ||
        model.id.includes('claude') ||
        model.id.includes('gemini-2.5-pro') ||
        (model.description && model.description.toLowerCase().includes('reasoning'));
    } else if (activeCategory === 'Coding') {
      matchesCategory = 
        model.category === 'Coding' || 
        model.id === 'auto' ||
        model.id === 'auto/coding' ||
        model.id.includes('claude') ||
        model.id.includes('code') || 
        model.id.includes('coder') || 
        model.id.includes('qwen') || 
        model.id.includes('deepseek') ||
        (model.description && (
          model.description.toLowerCase().includes('coding') || 
          model.description.toLowerCase().includes('programming') || 
          model.description.toLowerCase().includes('syntax') ||
          model.description.toLowerCase().includes('software')
        ));
    } else if (activeCategory === 'Image') {
      matchesCategory = 
        model.category === 'Image' || 
        model.id.includes('flux') || 
        model.id.includes('diffusion') || 
        model.id.includes('sana') || 
        model.id.includes('image') ||
        (model.description && (
          model.description.toLowerCase().includes('image') || 
          model.description.toLowerCase().includes('photorealistic') ||
          model.description.toLowerCase().includes('visual')
        ));
    } else if (activeCategory === 'Video') {
      matchesCategory = 
        model.category === 'Video' || 
        model.id.includes('kling') || 
        model.id.includes('luma') || 
        model.id.includes('cogvideo') || 
        model.id.includes('video') ||
        (model.description && (
          model.description.toLowerCase().includes('video') || 
          model.description.toLowerCase().includes('cinematic') ||
          model.description.toLowerCase().includes('motion')
        ));
    } else if (activeCategory !== 'All') {
      matchesCategory = model.category && model.category.toLowerCase() === catLower;
    }

    const matchesSearch = 
      model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      model.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      model.provider.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (model.description && model.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (model.badge && model.badge.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesSearch;
  });

  const handleSelect = (modelId) => {
    onSelectModel(modelId);
    onClose();
  };

  const handleApplyCustomModel = (e) => {
    e.preventDefault();
    if (customModelInput.trim()) {
      onSelectModel(customModelInput.trim());
      setCustomModelInput('');
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal model-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <p className="eyebrow">LEWIS INTELLIGENCE ROUTER</p>
            <h2>Choose your model & gateway</h2>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close">
            <X />
          </button>
        </div>

        <div className="modal-search">
          <Search />
          <input 
            autoFocus 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
            placeholder="Search 82+ models, providers, capabilities..." 
          />
        </div>

        <div className="filter-tabs">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              className={activeCategory === cat ? 'selected' : ''}
              onClick={() => setActiveCategory(cat)}
            >
              {cat === 'All' ? 'All models' : cat}
            </button>
          ))}
        </div>

        <div className="model-grid">
          {filteredModels.map((model) => {
            const isSelected = activeModelId === model.id;
            const colorClass = model.providerType === 'omniroute' ? 'green' : model.providerType === 'groq' ? 'yellow' : model.providerType === 'openrouter' ? 'red' : 'silver';

            return (
              <button
                key={model.id}
                type="button"
                className={`model-card ${isSelected ? 'selected' : ''}`}
                onClick={() => handleSelect(model.id)}
              >
                <div className="card-top">
                  <span className={`provider-icon ${colorClass}`}>
                    <Sparkles />
                  </span>
                  <span className="provider-name">{model.provider}</span>
                  {isSelected && <span className="active-badge">Active</span>}
                </div>

                <h3>{model.name}</h3>
                <p>{model.description}</p>

                <div className="model-meta">
                  <span>{model.parameters}</span>
                  <span>{model.contextWindow}</span>
                  <span>{model.badge}</span>
                </div>
              </button>
            );
          })}
        </div>

        <form onSubmit={handleApplyCustomModel} className="custom-model">
          <span>Custom model ID</span>
          <div>
            <input 
              placeholder="e.g. nvidia/nemotron-3.5-lightning:free or custom-id" 
              value={customModelInput}
              onChange={(e) => setCustomModelInput(e.target.value)}
            />
            <button type="submit" disabled={!customModelInput.trim()}>
              Use model <ChevronRight />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
