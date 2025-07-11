// 文档导出工具类
export class DocumentExporter {
  
  // 将Markdown文本转换为HTML
  private static markdownToHtml(markdown: string): string {
    let html = markdown
      // 标题转换
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      // 列表转换
      .replace(/^\- \[ \] (.*$)/gim, '<p>☐ $1</p>')
      .replace(/^\- \[x\] (.*$)/gim, '<p>☑ $1</p>')
      .replace(/^\- (.*$)/gim, '<li>$1</li>')
      .replace(/^\* (.*$)/gim, '<li>$1</li>')
      .replace(/^\d+\. (.*$)/gim, '<li>$1</li>')
      // 粗体和斜体
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // 段落转换
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>');

    // 包装列表项
    html = html.replace(/(<li>.*<\/li>)/g, '<ul>$1</ul>');
    // 包装段落
    if (!html.startsWith('<h') && !html.startsWith('<p>')) {
      html = '<p>' + html + '</p>';
    }

    return html;
  }

  // 生成Word文档的HTML模板
  private static generateWordHtml(title: string, content: string): string {
    const htmlContent = this.markdownToHtml(content);
    
    return `
<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset='utf-8'>
  <title>${title}</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>90</w:Zoom>
      <w:DoNotPromptForConvert/>
      <w:DoNotShowInsertionsAndDeletions/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    @page {
      margin: 1in;
    }
    body {
      font-family: 'Microsoft YaHei', '微软雅黑', Arial, sans-serif;
      font-size: 12pt;
      line-height: 1.6;
      color: #333;
    }
    h1 {
      font-size: 18pt;
      font-weight: bold;
      color: #b01c02;
      margin-top: 20pt;
      margin-bottom: 12pt;
      page-break-after: avoid;
    }
    h2 {
      font-size: 16pt;
      font-weight: bold;
      color: #333;
      margin-top: 16pt;
      margin-bottom: 8pt;
      page-break-after: avoid;
    }
    h3 {
      font-size: 14pt;
      font-weight: bold;
      color: #555;
      margin-top: 12pt;
      margin-bottom: 6pt;
      page-break-after: avoid;
    }
    p {
      margin-bottom: 8pt;
      text-align: justify;
    }
    ul, ol {
      margin-left: 20pt;
      margin-bottom: 8pt;
    }
    li {
      margin-bottom: 4pt;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      margin-bottom: 12pt;
    }
    td, th {
      border: 1pt solid #ccc;
      padding: 6pt;
      text-align: left;
    }
    th {
      background-color: #f5f5f5;
      font-weight: bold;
    }
    .todo-item {
      margin-bottom: 4pt;
      padding-left: 16pt;
    }
    .header {
      text-align: center;
      margin-bottom: 24pt;
      border-bottom: 2pt solid #b01c02;
      padding-bottom: 12pt;
    }
    .footer {
      margin-top: 24pt;
      padding-top: 12pt;
      border-top: 1pt solid #ccc;
      font-size: 10pt;
      color: #666;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${title}</h1>
    <p style="color: #666;">QPLZ前排落座 · 女性社区活动策划书</p>
    <p style="color: #999; font-size: 10pt;">生成时间：${new Date().toLocaleString('zh-CN')}</p>
  </div>
  
  <div class="content">
    ${htmlContent}
  </div>
  
  <div class="footer">
    <p>本文档由QPLZ活动策划助手自动生成</p>
    <p>如有疑问，请联系策划团队进行确认和完善</p>
  </div>
</body>
</html>`;
  }

  // 下载为Word文档
  static async downloadAsWord(title: string, content: string): Promise<void> {
    try {
      const wordHtml = this.generateWordHtml(title, content);
      
      // 创建Blob对象，使用docx格式
      const blob = new Blob(['\ufeff', wordHtml], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });
      
      // 创建下载链接
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${title}_策划书_${new Date().toISOString().split('T')[0]}.docx`;
      
      // 触发下载
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // 清理URL对象
      window.URL.revokeObjectURL(url);
      
      console.log('文档下载成功');
    } catch (error) {
      console.error('文档下载失败:', error);
      throw new Error('文档下载失败，请重试');
    }
  }

  // 下载为纯文本文档
  static async downloadAsText(title: string, content: string): Promise<void> {
    try {
      // 清理Markdown格式，转换为纯文本
      const plainText = content
        .replace(/^#{1,6}\s+/gm, '') // 移除标题标记
        .replace(/\*\*(.*?)\*\*/g, '$1') // 移除粗体标记
        .replace(/\*(.*?)\*/g, '$1') // 移除斜体标记
        .replace(/^\- /gm, '• ') // 转换列表标记
        .replace(/^\d+\. /gm, '• ') // 转换有序列表
        .replace(/\n{3,}/g, '\n\n'); // 清理多余换行
      
      const textContent = `${title}\n${'='.repeat(title.length)}\n\n生成时间：${new Date().toLocaleString('zh-CN')}\n生成工具：QPLZ活动策划助手\n\n${plainText}\n\n---\n本文档由QPLZ活动策划助手自动生成\n如有疑问，请联系策划团队进行确认和完善`;
      
      const blob = new Blob([textContent], {
        type: 'text/plain;charset=utf-8'
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${title}_策划书_${new Date().toISOString().split('T')[0]}.txt`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      window.URL.revokeObjectURL(url);
      
      console.log('文本文档下载成功');
    } catch (error) {
      console.error('文本文档下载失败:', error);
      throw new Error('文本文档下载失败，请重试');
    }
  }

  // 复制到剪贴板
  static async copyToClipboard(content: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(content);
      console.log('内容已复制到剪贴板');
    } catch (error) {
      console.error('复制失败:', error);
      // 降级方案
      const textArea = document.createElement('textarea');
      textArea.value = content;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      console.log('内容已复制到剪贴板（降级方案）');
    }
  }
} 