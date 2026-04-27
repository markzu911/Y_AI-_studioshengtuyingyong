/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  ArrowRight, 
  Plus, 
  Trash2, 
  Check, 
  Loader2, 
  Layout, 
  Image as ImageIcon, 
  Maximize, 
  Layers, 
  ChevronLeft,
  Copy,
  PenTool,
  Palette,
  Settings
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from './lib/utils';
import { 
  analyzeAppRules, 
  recommendStyles, 
  suggestFeatureOptions, 
  generateFinalPrompt,
  analyzeProductQualities
} from './services/geminiService';

type Step = 'home' | 'analysis' | 'design' | 'analysis-config' | 'result';
type GenerationMode = 'one-click' | 'intelligent';

interface ImageDef {
  id: string;
  name: string;
}

export default function App() {
  const [step, setStep] = useState<Step>('home');
  const [targetAppTheme, setTargetAppTheme] = useState<'light' | 'dark'>('light');
  const [appName, setAppName] = useState('');
  const [generationMode, setGenerationMode] = useState<GenerationMode>('one-click');
  const [loading, setLoading] = useState(false);
  
  // Step 1: Analysis
  const [rules, setRules] = useState<string[]>([]);
  
  // Step 2: Design
  const [featureOptions, setFeatureOptions] = useState<string[]>([]);
  const [selectedFeature, setSelectedFeature] = useState('');
  const [images, setImages] = useState<ImageDef[]>([{ id: '1', name: '主图' }]);
  const [recommendedStyles, setRecommendedStyles] = useState<string[]>([]);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [allowUserStyles, setAllowUserStyles] = useState(false);
  const [selectedResolutions, setSelectedResolutions] = useState<string[]>(['1k']);
  const [selectedRatios, setSelectedRatios] = useState<string[]>(['1:1']);
  const [isBackendEnabled, setIsBackendEnabled] = useState(false);
  const [isSaaSIntegrated, setIsSaaSIntegrated] = useState(false);

  // Step 2.5: Analysis (Intelligent)
  const [analysisGroups, setAnalysisGroups] = useState<{ name: string; items: { label: string; canCustomize: boolean }[] }[]>([]);

  // Step 3: Result
  const [finalPrompt, setFinalPrompt] = useState('');

  const RESOLUTIONS = ['1k', '2k', '4k'];
  const RATIOS = ['1:1', '3:4', '4:3', '16:9', '9:16'];

  const handleStartAnalysis = async () => {
    if (!appName.trim()) return;
    setLoading(true);
    try {
      const aiRules = await analyzeAppRules(appName);
      setRules(aiRules);
      setStep('analysis');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleGoToDesign = async () => {
    setLoading(true);
    try {
      const [styles, features] = await Promise.all([
        recommendStyles(appName),
        suggestFeatureOptions(appName)
      ]);
      setRecommendedStyles(styles);
      setFeatureOptions(features);
      setSelectedFeature(features[0]);
      setStep('design');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      if (generationMode === 'intelligent') {
        const groups = await analyzeProductQualities(appName);
        setAnalysisGroups(groups);
        setStep('analysis-config');
      } else {
        const result = await generateFinalPrompt({
          appName,
          rules,
          selectedFeature,
          images,
          selectedStyles,
          allowUserAddStyles: allowUserStyles,
          selectedResolutions,
          selectedRatios,
          isBackendEnabled,
          isSaaSIntegrated,
          theme: targetAppTheme
        });
        setFinalPrompt(result || '');
        setStep('result');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleFinalGenerate = async () => {
    setLoading(true);
    try {
      const result = await generateFinalPrompt({
        appName,
        rules,
        selectedFeature,
        images,
        selectedStyles,
        allowUserAddStyles: allowUserStyles,
        selectedResolutions,
        selectedRatios,
        isBackendEnabled,
        isSaaSIntegrated,
        theme: targetAppTheme,
        analysisGroups
      });
      setFinalPrompt(result || '');
      setStep('result');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const addImage = () => {
    setImages([...images, { id: Date.now().toString(), name: '新图' }]);
  };

  const removeImage = (id: string) => {
    if (images.length > 1) {
      setImages(images.filter(img => img.id !== id));
    }
  };

  const toggleStyle = (style: string) => {
    if (selectedStyles.includes(style)) {
      setSelectedStyles(selectedStyles.filter(s => s !== style));
    } else {
      setSelectedStyles([...selectedStyles, style]);
    }
  };

  const toggleReso = (reso: string) => {
    if (selectedResolutions.includes(reso)) {
      if (selectedResolutions.length > 1) {
        setSelectedResolutions(selectedResolutions.filter(r => r !== reso));
      }
    } else {
      setSelectedResolutions([...selectedResolutions, reso]);
    }
  };

  const toggleRatio = (ratio: string) => {
    if (selectedRatios.includes(ratio)) {
      if (selectedRatios.length > 1) {
        setSelectedRatios(selectedRatios.filter(r => r !== ratio));
      }
    } else {
      setSelectedRatios([...selectedRatios, ratio]);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(finalPrompt);
    alert('已复制到剪贴板');
  };

  return (
    <div className={cn(
      "min-h-screen flex flex-col font-sans transition-colors duration-500",
      "bg-neutral-50 text-neutral-900"
    )}>
      {/* Header Navigation */}
      <header className={cn(
        "fixed top-0 left-0 right-0 h-16 border-b z-50 flex items-center px-8 justify-between shrink-0 transition-colors duration-500",
        "bg-white/80 border-neutral-200"
      )}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">Σ</div>
          <span className={cn(
            "font-semibold tracking-tight text-lg"
          )}>PromptForge 行图架构师</span>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-3">
            <div className={cn(
              "h-1.5 w-32 rounded-full overflow-hidden",
              "bg-neutral-100"
            )}>
              <div 
                className="h-full bg-indigo-500 transition-all duration-500" 
                style={{ width: step === 'home' ? '25%' : step === 'analysis' ? '50%' : step === 'design' ? '75%' : '100%' }}
              />
            </div>
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
              {step === 'home' ? '阶段 1/4' : step === 'analysis' ? '阶段 2/4' : step === 'design' ? '阶段 3/4' : '阶段 4/4'}
            </span>
          </div>
          {step === 'design' && (
            <button
              onClick={handleGenerate}
              className="px-6 py-2 bg-indigo-600 text-white rounded-full text-sm font-semibold hover:bg-indigo-700 transition-all active:scale-95"
            >
              生成提示词模板
            </button>
          )}
        </div>
      </header>

      <main className={cn("flex-1 pt-16 flex overflow-hidden", step === 'home' && "block overflow-y-auto")}>
        <AnimatePresence mode="wait">
          {step === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center text-center px-6 max-w-4xl mx-auto space-y-12 py-20"
            >
              <div className="space-y-6">
                <h1 className={cn(
                  "text-6xl md:text-8xl font-serif font-black tracking-tighter leading-[0.85] uppercase transition-colors duration-500",
                  "text-neutral-900"
                )}>
                  提示词 
                </h1>
                <p className="text-lg text-neutral-500 max-w-xl mx-auto font-medium">
                  为专业生图应用构建深度架构。支持多行业工作流定制，一键生成专家级生图提示词。
                </p>
              </div>

              <div className="w-full max-w-2xl bg-white border border-neutral-200 rounded-2xl shadow-sm p-2 flex items-center gap-2">
                <Layout className="w-5 h-5 text-neutral-400 ml-4" />
                <input
                  type="text"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  placeholder="例如：宠物时尚摄影应用"
                  className="flex-1 bg-transparent border-none outline-none text-lg py-4 placeholder:text-neutral-300 font-serif italic"
                  onKeyDown={(e) => e.key === 'Enter' && handleStartAnalysis()}
                />
                <button
                  onClick={handleStartAnalysis}
                  disabled={loading || !appName.trim()}
                  className="bg-neutral-900 text-white px-8 py-4 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-600 transition-all active:scale-95 disabled:opacity-30"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                  分析应用
                </button>
              </div>

              <div className="flex flex-wrap justify-center gap-6">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-300 w-full mb-2">行业快选</span>
                {['极简家居设计', '复古服饰电商', '高新电子建模', '餐饮美食写真'].map(t => (
                  <button 
                    key={t}
                    onClick={() => setAppName(t)} 
                    className="text-xs font-bold text-neutral-400 hover:text-indigo-600 border-b border-neutral-200 pb-1"
                  >
                    {t}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 'analysis' && (
            <motion.div
              key="analysis"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex-1 flex overflow-hidden"
            >
              {/* Sidebar variant for Analysis */}
              <aside className={cn(
                "w-[380px] border-r p-8 overflow-y-auto custom-scrollbar shrink-0 transition-colors duration-500",
                "bg-white border-neutral-200"
              )}>
                <div className="space-y-10">
                  <section>
                    <h3 className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.2em] mb-6">当前应用背景</h3>
                    <div className={cn(
                      "p-5 rounded-2xl border transition-colors",
                      "bg-neutral-50 border-neutral-100"
                    )}>
                      <p className="text-[10px] font-bold text-neutral-400 uppercase mb-2">应用名称</p>
                      <p className={cn(
                        "text-xl font-serif font-black italic tracking-tight leading-tight",
                        "text-indigo-900"
                      )}>{appName}</p>
                    </div>
                  </section>
                  <section>
                    <button
                      onClick={() => setStep('home')}
                      className="flex items-center gap-2 text-[10px] font-bold text-neutral-400 hover:text-indigo-600 uppercase tracking-widest transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" /> 返回修改应用
                    </button>
                  </section>
                </div>
              </aside>

              {/* Content area */}
              <section className={cn(
                "flex-1 p-12 overflow-y-auto custom-scrollbar transition-colors duration-500",
                "bg-neutral-100"
              )}>
                <div className="max-w-3xl mx-auto space-y-10">
                  <div className="space-y-2 border-l-4 border-indigo-600 pl-6">
                    <h2 className={cn(
                      "text-4xl font-serif italic",
                      "text-neutral-800"
                    )}>核心生图规范</h2>
                    <p className="text-neutral-500 font-medium">AI 自动提取了行业级的硬性准则，点击可直接编辑。</p>
                  </div>

                  <div className="space-y-4">
                    {rules.map((rule, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                          "group flex items-center gap-6 p-6 rounded-2xl border shadow-sm hover:border-indigo-300 transition-all",
                          "bg-white border-neutral-200"
                        )}
                      >
                        <span className={cn(
                          "font-serif italic font-black text-2xl group-hover:text-indigo-100 transition-colors",
                          "text-neutral-200"
                        )}>
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <input
                          type="text"
                          value={rule}
                          onChange={(e) => {
                            const newRules = [...rules];
                            newRules[index] = e.target.value;
                            setRules(newRules);
                          }}
                          className={cn(
                            "flex-1 bg-transparent border-none outline-none font-serif text-lg italic",
                            "text-neutral-800"
                          )}
                        />
                        <button
                          onClick={() => setRules(rules.filter((_, i) => i !== index))}
                          className="opacity-0 group-hover:opacity-100 p-2 text-neutral-300 hover:text-red-500 transition-all"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </motion.div>
                    ))}
                    <button
                      onClick={() => setRules([...rules, ''])}
                      className="w-full py-6 border-2 border-dashed border-neutral-300 rounded-2xl text-neutral-400 font-bold uppercase tracking-widest text-xs hover:border-indigo-400 hover:text-indigo-600 transition-all"
                    >
                      + 添加自定义行业规范
                    </button>
                  </div>

                  <div className="flex justify-end pt-12">
                    <button
                      onClick={handleGoToDesign}
                      disabled={loading}
                      className="bg-indigo-600 text-white px-10 py-4 rounded-full font-bold shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-3"
                    >
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                      确认规范进入配置
                    </button>
                  </div>
                </div>
              </section>
            </motion.div>
          )}

          {step === 'design' && (
            <motion.div
              key="design"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex-1 flex overflow-hidden"
            >
              {/* Sidebar Configuration */}
              <aside className={cn(
                "w-[380px] border-r p-8 overflow-y-auto custom-scrollbar shrink-0 transition-colors duration-500",
                "bg-white border-neutral-200"
              )}>
                <div className="space-y-10">
                  <section>
                    <h3 className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.2em] mb-4">核心规范回顾</h3>
                    <div className="space-y-2">
                      {rules.slice(0, 3).map((r, i) => (
                        <div key={i} className="text-[11px] text-neutral-500 font-medium leading-relaxed flex gap-2">
                          <span className="text-indigo-400 font-black">·</span>
                          <span className="truncate">{r}</span>
                        </div>
                      ))}
                      {rules.length > 3 && <p className="text-[10px] text-neutral-300 italic">及其他 {rules.length - 3} 条规范</p>}
                    </div>
                  </section>

                  <section>
                    <h3 className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.2em] mb-6">生成模式设定</h3>
                    <div className="grid grid-cols-1 gap-2">
                      <button
                        onClick={() => setGenerationMode('one-click')}
                        className={cn(
                          "py-3 px-4 border rounded-xl text-xs font-bold transition-all text-left flex items-center justify-between",
                          generationMode === 'one-click' 
                            ? "border-indigo-600 bg-indigo-50 text-indigo-700" 
                            : "border-neutral-200 text-neutral-500 hover:bg-neutral-50"
                        )}
                      >
                        <div>
                          <p>AI 一键生图</p>
                          <p className="text-[9px] font-normal opacity-60">基于当前配置快速生成提示词</p>
                        </div>
                        {generationMode === 'one-click' && <Check className="w-3 h-3" />}
                      </button>
                      <button
                        onClick={() => setGenerationMode('intelligent')}
                        className={cn(
                          "py-3 px-4 border rounded-xl text-xs font-bold transition-all text-left flex items-center justify-between",
                          generationMode === 'intelligent' 
                            ? "border-indigo-600 bg-indigo-50 text-indigo-700" 
                            : "border-neutral-200 text-neutral-500 hover:bg-neutral-50"
                        )}
                      >
                        <div>
                          <p>AI 智能分析生图</p>
                          <p className="text-[9px] font-normal opacity-60">深度分析产品维度，支持精细化配置</p>
                        </div>
                        {generationMode === 'intelligent' && <Check className="w-3 h-3" />}
                      </button>
                    </div>
                  </section>

                  <section>
                    <h3 className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.2em] mb-6">核心功能配置</h3>
                    <p className={cn(
                      "text-[11px] font-bold mb-3 uppercase tracking-tighter",
                      "text-neutral-900"
                    )}>环境/载体选择</p>
                    <div className="grid grid-cols-1 gap-2">
                      {featureOptions.map((opt) => (
                        <button
                          key={opt}
                          onClick={() => setSelectedFeature(opt)}
                          className={cn(
                            "py-3 px-4 border rounded-xl text-xs font-bold transition-all text-left flex items-center justify-between",
                            selectedFeature === opt 
                              ? "border-indigo-600 bg-indigo-50 text-indigo-700" 
                              : "border-neutral-200 text-neutral-500 hover:bg-neutral-50"
                          )}
                        >
                          {opt}
                          {selectedFeature === opt && <Check className="w-4 h-4" />}
                        </button>
                      ))}
                    </div>
                  </section>

                  <section>
                    <h3 className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.2em] mb-6">生成规格设置</h3>
                    <div className="space-y-3">
                      {images.map((img, idx) => (
                        <div key={img.id} className="flex gap-2">
                          <input
                            type="text"
                            value={img.name}
                            onChange={(e) => {
                              const newImgs = [...images];
                              newImgs[idx].name = e.target.value;
                              setImages(newImgs);
                            }}
                            className={cn(
                              "flex-1 border rounded-lg p-2 text-xs font-bold outline-none focus:border-indigo-200 transition-colors",
                              "bg-neutral-50 border-neutral-100 text-neutral-700"
                            )}
                          />
                          {images.length > 1 && (
                            <button onClick={() => removeImage(img.id)} className="px-2 text-neutral-300 hover:text-red-500">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                      <button onClick={addImage} className="text-[10px] text-indigo-600 font-bold uppercase tracking-widest underline decoration-indigo-200 underline-offset-4">
                        + 新增输出规格
                      </button>
                    </div>
                  </section>
                </div>
              </aside>

              {/* Main Visual Config */}
              <section className={cn(
                "flex-1 p-12 overflow-y-auto custom-scrollbar transition-colors duration-500",
                "bg-neutral-100"
              )}>
                <div className="max-w-3xl mx-auto space-y-12">
                  <div className="space-y-6">
                    <div className={cn(
                      "flex items-center justify-between border-b pb-4",
                      "border-neutral-200"
                    )}>
                      <h3 className={cn(
                        "text-2xl font-serif italic tracking-tight",
                        "text-neutral-800"
                      )}>视觉风格与解析度</h3>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={allowUserStyles} onChange={(e) => setAllowUserStyles(e.target.checked)} className="hidden" />
                        <div className={cn("w-4 h-4 rounded-sm border flex items-center justify-center transition-all", allowUserStyles ? "bg-indigo-600 border-indigo-600" : "border-neutral-300")}>
                          {allowUserStyles && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">应用内追加风格</span>
                      </label>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {recommendedStyles.map((style) => (
                        <button
                          key={style}
                          onClick={() => toggleStyle(style)}
                          className={cn(
                            "px-5 py-2.5 rounded-full border text-xs font-bold uppercase tracking-wide transition-all",
                            selectedStyles.includes(style)
                              ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                              : "bg-white border-neutral-200 text-neutral-600 hover:border-neutral-800"
                          )}
                        >
                          {style}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-12 pt-8 border-t border-neutral-200">
                    <div className="space-y-6">
                      <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest underline decoration-indigo-200 underline-offset-4">解析度规格</p>
                      <div className="flex gap-2">
                        {RESOLUTIONS.map(r => (
                          <button
                            key={r}
                            onClick={() => toggleReso(r)}
                            className={cn(
                              "w-12 h-12 flex items-center justify-center border font-black text-xs transition-all rounded-lg",
                              selectedResolutions.includes(r)
                                ? "border-indigo-600 bg-indigo-50 text-indigo-600"
                                : "border-neutral-200 text-neutral-300 hover:border-neutral-400"
                            )}
                          >
                            {r.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-6">
                      <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest underline decoration-indigo-200 underline-offset-4">比例适配</p>
                      <div className="flex justify-between items-end h-16 gap-2 px-1">
                        {RATIOS.map(ratio => (
                          <div key={ratio} className="flex flex-col items-center gap-2">
                            <button
                              onClick={() => toggleRatio(ratio)}
                              className={cn(
                                "border-2 transition-all relative cursor-pointer",
                                ratio === '1:1' && "w-8 h-8",
                                ratio === '3:4' && "w-7 h-9",
                                ratio === '4:3' && "w-9 h-7",
                                ratio === '16:9' && "w-11 h-6",
                                ratio === '9:16' && "w-6 h-11",
                                selectedRatios.includes(ratio) 
                                  ? "border-indigo-600 bg-indigo-50 shadow-inner" 
                                  : "border-neutral-200 grayscale opacity-40 hover:opacity-100"
                              )}
                            />
                            <span className={cn(
                              "text-[9px] font-black uppercase tracking-tighter transition-colors",
                              selectedRatios.includes(ratio) ? "text-indigo-600" : "text-neutral-400"
                            )}>
                              {ratio}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-12 border-t border-neutral-200">
                    <div className="flex items-center gap-3 mb-8">
                      <Palette className="w-5 h-5 text-indigo-600" />
                      <h3 className={cn(
                        "text-xl font-serif italic",
                        "text-neutral-800"
                      )}>生成目标应用主题</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <button
                        onClick={() => setTargetAppTheme('light')}
                        className={cn(
                          "flex items-center justify-center gap-3 p-6 border-2 rounded-2xl transition-all",
                          targetAppTheme === 'light' ? "border-indigo-600 bg-white shadow-sm" : "border-neutral-200 bg-neutral-50"
                        )}
                      >
                        <div className="w-6 h-6 rounded-full bg-neutral-100 border border-neutral-200" />
                        <span className="font-bold text-sm">珍珠白风格 (Light)</span>
                      </button>
                      <button
                        onClick={() => setTargetAppTheme('dark')}
                        className={cn(
                          "flex items-center justify-center gap-3 p-6 border-2 rounded-2xl transition-all",
                          targetAppTheme === 'dark' ? "border-indigo-600 bg-white shadow-sm" : "border-neutral-200 bg-neutral-50"
                        )}
                      >
                        <div className="w-6 h-6 rounded-full bg-neutral-900 border border-neutral-700" />
                        <span className="font-bold text-sm">暗夜黑风格 (Dark)</span>
                      </button>
                    </div>
                  </div>

                  <div className="pt-12 border-t border-neutral-200">
                    <div className="flex items-center gap-3 mb-8">
                      <Layout className="w-5 h-5 text-indigo-600" />
                      <h3 className="text-xl font-serif italic text-neutral-800">工程架构与平台接入设计</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <label className="flex items-start gap-4 p-6 bg-white border border-neutral-200 rounded-2xl cursor-pointer group hover:border-indigo-400 hover:shadow-lg hover:shadow-indigo-500/5 transition-all">
                        <div className="mt-1">
                          <input 
                            type="checkbox" 
                            checked={isBackendEnabled} 
                            onChange={(e) => setIsBackendEnabled(e.target.checked)} 
                            className="w-4 h-4 rounded border-neutral-300 text-indigo-600 focus:ring-indigo-600"
                          />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-neutral-800 group-hover:text-indigo-600 transition-colors">服务端逻辑隔离 (Backend Isolation)</p>
                          <p className="text-[10px] text-neutral-400 font-bold leading-relaxed uppercase tracking-widest leading-tight">启用后端执行模式，核心生图请求将由后端转发处理，通过 .env 安全加载 Key，杜绝浏览器端泄露风险。</p>
                        </div>
                      </label>

                      <label className="flex items-start gap-4 p-6 bg-white border border-neutral-200 rounded-2xl cursor-pointer group hover:border-indigo-400 hover:shadow-lg hover:shadow-indigo-500/5 transition-all">
                        <div className="mt-1">
                          <input 
                            type="checkbox" 
                            checked={isSaaSIntegrated} 
                            onChange={(e) => setIsSaaSIntegrated(e.target.checked)} 
                            className="w-4 h-4 rounded border-neutral-300 text-indigo-600 focus:ring-indigo-600"
                          />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-neutral-800 group-hover:text-indigo-600 transition-colors">企业级 SaaS 平台接入 (SaaS API Integration)</p>
                          <p className="text-[10px] text-neutral-400 font-bold leading-relaxed uppercase tracking-widest leading-tight">直接适配企业级 SaaS 平台接口规范，三步走流程 (Launch/Verify/Consume) 自动集成积分扣除与审计逻辑。</p>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              </section>
            </motion.div>
          )}

          {step === 'analysis-config' && (
            <motion.div
              key="analysis-config"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              className="flex-1 p-12 overflow-y-auto custom-scrollbar bg-neutral-100"
            >
              <div className="max-w-4xl mx-auto space-y-10">
                <header className="space-y-4">
                  <div className="flex items-center gap-4 text-indigo-600">
                    <PenTool className="w-8 h-8" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.3em]">Phase 2.5: Analysis Refinement</span>
                  </div>
                  <h2 className="text-5xl font-serif italic text-neutral-800">配置智能分析维度</h2>
                  <p className="text-neutral-500 font-medium">您可以为不同的核心主体（如：围巾、模特）定义分析维度。这些分析结果将自动增强生图提示词的精确度。</p>
                </header>

                <div className="space-y-12">
                  <AnimatePresence mode="popLayout">
                    {analysisGroups.map((group, gIndex) => (
                      <motion.div
                        key={gIndex}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="p-8 rounded-3xl bg-white border border-neutral-200 shadow-sm transition-all"
                      >
                        <div className="flex items-center gap-4 mb-8">
                          <div className="flex-1">
                            <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest block mb-2">分析主体名称</label>
                            <input
                              value={group.name}
                              onChange={(e) => {
                                const newGroups = [...analysisGroups];
                                newGroups[gIndex].name = e.target.value;
                                setAnalysisGroups(newGroups);
                              }}
                              className="w-full bg-transparent border-b border-neutral-100 py-2 outline-none font-serif text-2xl italic text-indigo-600 placeholder:text-neutral-200 focus:border-indigo-400 transition-colors"
                              placeholder="例如：特定产品名称..."
                            />
                          </div>
                          <button
                            onClick={() => setAnalysisGroups(analysisGroups.filter((_, i) => i !== gIndex))}
                            className="p-3 text-neutral-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all mt-6"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>

                        <div className="space-y-4 ml-4 pl-8 border-l-2 border-neutral-100">
                          {group.items.map((item, iIndex) => (
                            <div key={iIndex} className="flex items-center gap-6 group/item">
                              <div className="flex-1 relative">
                                <input
                                  value={item.label}
                                  onChange={(e) => {
                                    const newGroups = [...analysisGroups];
                                    newGroups[gIndex].items[iIndex].label = e.target.value;
                                    setAnalysisGroups(newGroups);
                                  }}
                                  className="w-full py-3 bg-transparent border-b border-neutral-50 outline-none text-sm text-neutral-700 placeholder:text-neutral-200 focus:border-indigo-200 transition-colors"
                                  placeholder="分析维度 (如: 材质纹理)..."
                                />
                              </div>
                              
                              <div className="flex items-center gap-4">
                                <button
                                  onClick={() => {
                                    const newGroups = [...analysisGroups];
                                    newGroups[gIndex].items[iIndex].canCustomize = !newGroups[gIndex].items[iIndex].canCustomize;
                                    setAnalysisGroups(newGroups);
                                  }}
                                  className={cn(
                                    "flex items-center gap-2 px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all",
                                    item.canCustomize 
                                      ? "bg-indigo-600 text-white" 
                                      : "bg-neutral-100 text-neutral-400 border border-transparent hover:border-neutral-200"
                                  )}
                                >
                                  {item.canCustomize ? '可自定义' : '固定分析'}
                                </button>
                                
                                <button
                                  onClick={() => {
                                    const newGroups = [...analysisGroups];
                                    newGroups[gIndex].items = newGroups[gIndex].items.filter((_, i) => i !== iIndex);
                                    setAnalysisGroups(newGroups);
                                  }}
                                  className="p-2 text-neutral-200 hover:text-neutral-400 opacity-0 group-hover/item:opacity-100 transition-all"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                          
                          <button
                            onClick={() => {
                              const newGroups = [...analysisGroups];
                              newGroups[gIndex].items.push({ label: '', canCustomize: false });
                              setAnalysisGroups(newGroups);
                            }}
                            className="flex items-center gap-2 text-indigo-500 text-xs font-bold py-4 hover:text-indigo-700 transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                            <span>添加分析维度</span>
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  <button
                    onClick={() => setAnalysisGroups([...analysisGroups, { name: '', items: [{ label: '', canCustomize: false }] }])}
                    className="w-full py-8 border-2 border-dashed border-neutral-300 rounded-3xl text-neutral-400 font-bold uppercase tracking-widest text-xs hover:border-indigo-400 hover:text-indigo-600 hover:bg-neutral-50 transition-all flex flex-col items-center gap-4"
                  >
                    <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-all">
                      <Plus className="w-6 h-6" />
                    </div>
                    <span>添加新的分析对象</span>
                  </button>
                </div>

                <div className="flex justify-between items-center pt-10">
                  <button
                    onClick={() => setStep('design')}
                    className="text-neutral-400 font-bold text-xs uppercase tracking-widest flex items-center gap-2 hover:text-neutral-800 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    返回设计配置
                  </button>
                  <button
                    onClick={handleFinalGenerate}
                    disabled={loading}
                    className="bg-indigo-600 text-white px-12 py-5 rounded-full font-bold shadow-2xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-3 scale-110 active:scale-100"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                    完成智能分析并生成架构
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 'result' && (
            <motion.div
              key="result"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={cn(
                "flex-1 p-12 overflow-y-auto custom-scrollbar transition-colors duration-500",
                "bg-neutral-100"
              )}
            >
              <div className="max-w-4xl mx-auto space-y-10">
                <div className={cn(
                  "flex justify-between items-center p-8 rounded-3xl border shadow-sm transition-colors duration-500",
                  "bg-white border-neutral-200"
                )}>
                  <div>
                    <h2 className={cn(
                      "text-3xl font-serif italic transition-colors",
                      "text-neutral-800"
                    )}>框架规范预览</h2>
                    <p className="text-neutral-400 text-xs font-bold uppercase tracking-widest mt-2">已根据您的配置完成高质量提示词工程</p>
                  </div>
                  <div className="flex gap-4">
                    <button 
                      onClick={copyToClipboard}
                      className="px-6 py-3 bg-indigo-600 text-white rounded-full text-[10px] font-bold tracking-widest hover:bg-indigo-700 transition-all flex items-center gap-2"
                    >
                      <Copy className="w-4 h-4" /> 复制文本
                    </button>
                    <button 
                      onClick={() => setStep('design')}
                      className={cn(
                        "px-6 py-3 border rounded-full text-[10px] font-bold tracking-widest transition-all",
                        "bg-white border-neutral-200 hover:bg-neutral-50 text-neutral-600"
                      )}
                    >
                      返回配置
                    </button>
                  </div>
                </div>

                {/* Editorial Template Card */}
                <div className={cn(
                  "rounded-2xl shadow-2xl p-12 overflow-hidden border max-w-2xl mx-auto ring-8 transition-all duration-500",
                  targetAppTheme === 'light' ? "bg-white border-neutral-200 ring-indigo-50/20" : "bg-neutral-900 border-neutral-800 ring-indigo-900/10"
                )}>
                  <div className={cn(
                    "border-b-2 pb-6 mb-10 transition-colors",
                    targetAppTheme === 'light' ? "border-neutral-900" : "border-indigo-600"
                  )}>
                    <h1 className={cn(
                      "text-4xl font-serif font-black leading-tight",
                      targetAppTheme === 'light' ? "text-neutral-900" : "text-white"
                    )}>{appName}架构专家</h1>
                    <div className="mt-4 flex gap-6 text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">
                      <span>编号: PROV-{Math.floor(Date.now()/1000000)}</span>
                      <span>归类: AI-Creative</span>
                      <span>核心: v4.1.2</span>
                    </div>
                  </div>

                  <article className={cn(
                    "prose prose-sm prose-neutral prose-headings:font-serif prose-headings:italic max-w-none transition-colors duration-500",
                    targetAppTheme === 'dark' && "prose-invert"
                  )}>
                    <style>{`
                      .prose h3 {
                        border-left: 4px solid #4f46e5;
                        padding-left: 1rem;
                        font-weight: 800;
                        margin-top: 2.5rem;
                        color: #111827;
                      }
                      .prose p {
                        line-height: 1.8;
                        color: #4b5563;
                      }
                      .prose ul {
                        padding-left: 0;
                        list-style: none;
                      }
                    `}</style>
                    <ReactMarkdown>{finalPrompt}</ReactMarkdown>
                  </article>

                  <div className="mt-16 pt-8 border-t border-neutral-100 flex justify-between items-center">
                    <p className="text-[9px] text-neutral-300 font-bold uppercase tracking-widest">基于 PromptForge 核心 v4.0 生成</p>
                    <p className="text-[9px] text-neutral-300 font-bold uppercase tracking-widest italic tracking-tighter">AI Studio 仿真环境</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Loading Overlay */}
      <AnimatePresence>
        {loading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white/60 backdrop-blur-sm z-[100] flex flex-col items-center justify-center space-y-6"
          >
            <div className="relative">
              <div className="w-16 h-16 border-4 border-emerald-100 rounded-full animate-pulse" />
              <div className="absolute inset-0 w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-emerald-600 font-bold text-lg animate-pulse">
                {step === 'home' ? '正在进行行业分析...' : step === 'analysis' ? '正在加载配置选项...' : '正在构思大师级提示词...'}
              </p>
              <p className="text-gray-400 text-xs">大规模语言模型 (Gemini) 实时驱动</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
