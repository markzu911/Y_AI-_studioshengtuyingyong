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

export async function analyzeProductQualities(appName: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `针对生图应用【${appName}】，识别出 1-2 个核心分析主体（如：围巾、模特、背景等）。
    并为每个主体生成 3-4 个产品分析维度。
    请以 JSON 格式输出，结构如下：
    {
      "groups": [
        {
          "name": "主体名称 (如: 围巾)",
          "items": [
            { "label": "维度名称 (如: 材质)", "canCustomize": false }
          ]
        }
      ]
    }`,
    config: {
      responseMimeType: "application/json"
    }
  });

  try {
    const data = JSON.parse(response.text || "{}");
    return data.groups as { name: string; items: { label: string; canCustomize: boolean }[] }[];
  } catch (e) {
    console.error("Failed to parse analysis items:", e);
    return [{ name: "核心主体", items: [{ label: "产品材质", canCustomize: false }] }];
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
  ${data.analysisGroups ? `- 【产品智能化深度分析架构】:
    ${data.analysisGroups.map((group: any) => `- 主体: ${group.name}
      维度: ${group.items.map((i: any) => `${i.label}${i.canCustomize ? ' (用户可动态微调)' : ''}`).join('、')}`).join('\n    ')}` : ''}

  【行业生成逻辑引擎 (核心算法)】:
  - **极简上传规范（核心约束）**: 无论最终生成的图片包含多少角度（如背部、侧面、细节等），前端 UI **必须且只能提供一个**对应的上传位。严禁要求用户为不同角度上传多张素材图片。
  - **若为服装/鞋履/配饰**: 
    - 上传区：一个【产品图】位，一个【模特图】位（基于 ${data.selectedFeature} 逻辑）。
    - 生成逻辑：AI 必须基于【单张】产品图进行空间建模，自动推导出背部、侧面等 ${data.images.length} 个视角的画面。
  - **若为家具/家电/摆件**:
    - 上传区：一个【产品单品】位。
    - 生成逻辑：将单张产品图重组进 ${data.images.length} 个视角的场景中。
  ${data.analysisGroups ? `- 【智能分析与交互逻辑】:
    1. **解析与展示**: 在素材录入后，系统必须启动解析模块并将结果（如：${data.analysisGroups.map((g: any) => g.items.map((i: any) => i.label).join('、')).join('、')}）填入【输入框】。
    2. **用户控制权**: 应用 UI 必须允许用户直接在输入框修改内容，并提供【删除图标】以移除特定分析项。
    3. **最终注入**: 只有输入框中保留且通过用户确认的文本，才会作为 Prompt 约束参与生图。` : ''}

  请按以下 Markdown 格式输出：

  # ${data.appName} - AI 生图引擎架构指令集

  ## 1. 专家角色定义
  你是一位"[针对${data.appName}定义的顶级行业摄影与建模专家]"。

  ## 2. 核心功能及上传逻辑 (严格对齐)
  - **素材上传区与条件可见性**:
    - **产品图位**: 始终提供且仅提供【一个】上传入口。
    - **载体上传位 (针对 ${data.selectedFeature})**:
      ${data.selectedFeature === '由 AI 自动生成' ? '- **UI 规范**: 严禁显示载体上传框。UI 应仅展示生成风格的选择。' : ''}
      ${data.selectedFeature === '由用户自行上传' ? '- **UI 规范**: 必须显示【载体图片上传框】。' : ''}
      ${data.selectedFeature === '两者皆可' ? '- **UI 规范**: 必须提供一个【切换按钮】。当用户选择“AI 生成”时，自动隐藏载体上传框；当选择“手动上传”时，显示载体上传框。' : ''}
  - **极简上传交互**: 
    - 必须仅提供针对单个视角的素材上传位。
    - 即使输出包含 ${data.images.map((i: any) => i.name).join('、')}，也必须由 AI 自动根据单图推演，严禁要求用户重复上传。
  ${data.analysisGroups ? `  - **智能化深度分析模块 (Smart Insight UI)**:
    - **视觉优先级**: 该模块必须占据 UI 的核心视觉区域（不少于首屏 1/3 的面积），而非隐藏在次级菜单中。
    - **交互结构**: UI 必须采用【显眼的大号卡片式输入列表】：
    ${data.analysisGroups.map((g: any) => `* **主体: ${g.name}**: 
      - 为 ${g.items.map((i: any) => i.label).join('、')} 分别创建独立的高对比度输入框。
      - 必须支持：用户直接编辑文本、点击删除按钮移除整条分析项。`).join('\n    ')}` : ''}
  - **风格扩展性**: 
    ${data.allowUserAddStyles ? `- **UI 规范**: 必须在预设风格列表后提供一个【添加自定义风格】的输入位，允许用户通过文本描述动态扩展生成效果。` : '- **UI 规范**: 仅允许使用预设风格，不提供自定义文本输入。'}
  - **多角度输出**: 基于单图自动推定以下 ${data.images.length} 种规格的视角：${data.images.map((i: any) => i.name).join('、')}。
  - **逻辑**: [在此详细描述如何通过单张图片重构出 ${data.images.length} 个角度的专业逻辑，必须使用中文]。

  ## 3. 视觉与光影方案 (对应风格: ${data.selectedStyles.join('、')})
  [为选中的风格提供极其专业的中文 Prompt 引导逻辑，包含光影细节]。

  ## 4. 业务约束与可控性
  ${data.rules.map((rule: string) => `- ${rule}`).join('\n')}
  - 界面所有标签（如：开始生成、上传素材、重新预览）必须为中文。
  - 严禁修改产品的原始花纹、品牌标识及物理形状。

  ## 5. UI/UX 落地建议 (针对 ${data.theme === 'light' ? '珍珠白' : '暗夜黑'} 主题)
  1. **布局**: 采用[对应主题]设计风格。
  2. **交互**: [描述如何针对${data.selectedFeature}设计可视化选择器]。
  ${data.selectedResolutions.length > 1 ? `3. **清晰度选择**: 由于用户选择了多个清晰度（${data.selectedResolutions.join('、')}），UI 必须采用【底部抽屉式单选按钮组】进行切换，默认为第一个选项。\n  ` : ''}${data.selectedRatios.length > 1 ? `4. **尺寸比例选择**: 由于用户选择了多个画面比例（${data.selectedRatios.join('、')}），UI 必须采用【底部抽屉式单选按钮组】进行切换。\n  ` : ''}5. **色盘**: [给出符合行业特征的 Hex 色值]。

  ${data.isBackendEnabled || data.isSaaSIntegrated ? `## 6. 技术集成架构
  ${data.isBackendEnabled ? `- **安全性**: 启用 Backend Proxy。API Key 不在前端暴露。\n` : ''}${data.isSaaSIntegrated ? `- **积分链路**: 必须在“开始生成”前触发 verify 接口，生成后触发 consume 接口。` : ''}` : ''}
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: prompt
  });

  return response.text;
}
