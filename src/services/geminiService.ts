import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function analyzeAppRules(appName: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `你要为一个生图应用【${appName}】制定生图规范。
    请生成 3-5 条该行业生图必须遵守的硬性规范。
    例如针对鞋子电商：'必须完全复刻用户上传的商品进行生成不能修改', '必须保证鞋底纹路清晰'。
    请以 JSON 字符串数组格式输出，不要有任何 Markdown 修饰。`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      }
    }
  });

  try {
    return JSON.parse(response.text || "[]") as string[];
  } catch (e) {
    console.error("Failed to parse rules:", e);
    return [];
  }
}

export async function recommendStyles(appName: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `针对生图应用【${appName}】，推荐 5-8 个适合该行业的视觉风格关键词。
    例如餐饮类：'国潮风', 'ins风', '极简冷淡', '复古港式'。
    请以 JSON 字符串数组格式输出，不要有任何 Markdown 修饰。`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      }
    }
  });

  try {
    return JSON.parse(response.text || "[]") as string[];
  } catch (e) {
    console.error("Failed to parse styles:", e);
    return [];
  }
}

export async function suggestFeatureOptions(appName: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `针对生图应用【${appName}】，生成 3 个关于“环境/主体选择”的功能方案。
    比如服装类是：'用户上传模特', '虚拟模特', '两者皆可'。
    比如家具类是：'用户房间实拍', 'AI 生成房间', '两者皆可'。
    请根据应用类型调整这三个选项。只需返回这 3 个短语组成的 JSON 数组。`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      }
    }
  });

  try {
    return JSON.parse(response.text || "[]") as string[];
  } catch (e) {
    console.error("Failed to parse features:", e);
    return ["选项1", "选项2", "两者皆可"];
  }
}

export async function generateFinalPrompt(data: any) {
  const prompt = `你是一位顶级的提示词工程师，你的目标是为一个名为【${data.appName}】的生图应用生成一份【极度精确、严丝合缝】的架构提示词。
  
  【严厉警告】: 
  1. 严禁凭空编造任何用户未选择的功能（例如如果没有选择“侧面图”，则绝对禁止在输出中提及）。
  2. 严禁出现英文 UI 建议，所有按钮、标签、引导词必须统一为【简体中文】。
  
  【核心配置数据】:
  - 应用目标：${data.appName}
  - 必须遵守的硬性规范：${data.rules.join('；')}
  - 用户选定的载体功能：${data.selectedFeature} (注：这是唯一允许出现的主体功能。特别注意：若为“两者皆可”，则 UI 必须提供切换选项，允许用户选择【自行上传照片】或【由 AI 自动生成】)
  - 预设生成的图片及名称：${data.images.map((i: any) => i.name).join('、')} (注：上传区和生成区必须以此命名)
  - 核心风格：${data.selectedStyles.join('、')}
  - 清晰度：${data.selectedResolutions.join('、')}
  - 比例：${data.selectedRatios.join('、')}
  - 目标主题：${data.theme === 'light' ? '珍珠白 (Light Mode)' : '暗夜黑 (Dark Mode)'}
  - 技术栈：${data.isBackendEnabled ? '后端代理隔离' : '前端直连'} | ${data.isSaaSIntegrated ? 'SaaS 积分模型' : '标准模式'}

  【行业生成逻辑引擎 (核心算法)】:
  - 若为服装/鞋履/配饰：上传素材分为【产品图】与【模特图】。其中用户选定的载体功能【${data.selectedFeature}】定义了模特图的来源。若选中“两者皆可”，用户可决定是上传真实模特照片还是点击生成随机 AI 模特。生成逻辑：通过 AI 将产品图完美“穿戴/贴合”在模特身上，背景应根据风格自动演进。
  - 若为家具/家电/摆件：上传素材 = 【产品单品】。载体功能【${data.selectedFeature}】定义了背景环境的选择权。若选中“两者皆可”，用户可以上传实拍房间图作为底图，也可以选择纯 AI 环境。生成逻辑：将单品“重组/渲染”进特定的场景（如奶油风、侘寂风等）。

  请按以下 Markdown 格式输出：

  # ${data.appName} - AI 生图引擎架构指令集

  ## 1. 专家角色定义
  你是一位"[针对${data.appName}定义的顶级行业摄影与建模专家]"。你负责将用户上传的原始素材转化为极致品质的成品大片。

  ## 2. 核心功能及上传逻辑 (严格对齐)
  - **素材上传区**: 必须包含且仅包含针对【${data.selectedFeature}】的上传位。
  - **多角度输出**: 固定生成以下 ${data.images.length} 种规格：${data.images.map((i: any) => i.name).join('、')}。
  - **逻辑**: [在此详细描述${data.selectedFeature}如何与环境结合的专业逻辑，必须使用中文]。

  ## 3. 视觉与光影方案 (对应风格: ${data.selectedStyles.join('、')})
  [为选中的风格提供极其专业的中文 Prompt 引导逻辑，包含光影细节]。

  ## 4. 业务约束与可控性
  ${data.rules.map((rule: string) => `- ${rule}`).join('\n')}
  - 界面所有标签（如：开始生成、上传素材、重新预览）必须为中文。
  - 严禁修改产品的原始花纹、品牌标识及物理形状。

  ## 5. UI/UX 落地建议 (针对 ${data.theme === 'light' ? '珍珠白' : '暗夜黑'} 主题)
  1. **布局**: 采用[对应主题]设计风格。
  2. **交互**: [描述如何针对${data.selectedFeature}设计可视化选择器]。
  3. **色盘**: [给出符合行业特征的 Hex 色值]。

  ${data.isBackendEnabled || data.isSaaSIntegrated ? `## 6. 技术集成架构
  ${data.isBackendEnabled ? `- **安全性**: 启用 Backend Proxy。API Key 不在前端暴露。\n` : ''}${data.isSaaSIntegrated ? `- **积分链路**: 必须在“开始生成”前触发 verify 接口，生成后触发 consume 接口。` : ''}` : ''}
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: prompt
  });

  return response.text;
}
