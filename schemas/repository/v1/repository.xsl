<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" 
                xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
                xmlns:spl="https://stillpointlab.com/schemas/repository/v1">

<xsl:output method="html" doctype-public="-//W3C//DTD HTML 4.01//EN"/>

<xsl:template match="/">
  <html>
    <head>
      <title>Repository: <xsl:value-of select="spl:repository/spl:metadata/spl:root"/></title>
      <script>
        function toggleNode(nodeId) {
          const node = document.getElementById('node-' + nodeId);
          const children = document.getElementById('children-' + nodeId);
          const toggle = document.getElementById('toggle-' + nodeId);
          
          if (children) {
            if (children.style.display === 'none') {
              children.style.display = 'block';
              toggle.textContent = '▼';
              node.classList.add('expanded');
              node.classList.remove('collapsed');
            } else {
              children.style.display = 'none';
              toggle.textContent = '▶';
              node.classList.add('collapsed');
              node.classList.remove('expanded');
            }
          }
        }
        
        function expandAll() {
          const allChildren = document.querySelectorAll('.node-children');
          const allToggles = document.querySelectorAll('.toggle-icon');
          const allNodes = document.querySelectorAll('.node-directory');
          
          allChildren.forEach(child => child.style.display = 'block');
          allToggles.forEach(toggle => toggle.textContent = '▼');
          allNodes.forEach(node => {
            node.classList.add('expanded');
            node.classList.remove('collapsed');
          });
        }
        
        function collapseAll() {
          const allChildren = document.querySelectorAll('.node-children');
          const allToggles = document.querySelectorAll('.toggle-icon');
          const allNodes = document.querySelectorAll('.node-directory');
          
          allChildren.forEach(child => child.style.display = 'none');
          allToggles.forEach(toggle => toggle.textContent = '▶');
          allNodes.forEach(node => {
            node.classList.add('collapsed');
            node.classList.remove('expanded');
          });
        }
      </script>
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
          max-width: 1200px; 
          margin: 0 auto; 
          padding: 20px;
          line-height: 1.6;
          background: #f5f5f5;
        }
        .repository-header {
          background: white;
          border-radius: 8px;
          padding: 24px;
          margin-bottom: 24px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .repository-title {
          font-size: 2.5em;
          font-weight: 600;
          color: #1a1a1a;
          margin: 0 0 16px 0;
        }
        .metadata {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 16px;
          margin-top: 20px;
        }
        .metadata-item {
          background: #f8fafc;
          padding: 12px 16px;
          border-radius: 6px;
          border-left: 3px solid #3b82f6;
        }
        .metadata-label {
          font-weight: 600;
          color: #6b7280;
          font-size: 0.85em;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 4px;
        }
        .metadata-value {
          color: #1a1a1a;
          font-size: 0.95em;
          word-break: break-word;
        }
        .section {
          background: white;
          border-radius: 8px;
          padding: 24px;
          margin-bottom: 24px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .section-title {
          font-size: 1.5em;
          font-weight: 600;
          color: #1a1a1a;
          margin: 0 0 20px 0;
          padding-bottom: 12px;
          border-bottom: 2px solid #e5e7eb;
        }
        .tree {
          font-family: 'Consolas', 'Monaco', monospace;
          font-size: 0.9em;
          line-height: 1.8;
        }
        .node {
          margin: 2px 0;
          padding: 4px 8px;
          border-radius: 4px;
          transition: background 0.2s;
          position: relative;
          user-select: none;
        }
        .node:hover {
          background: #f0f9ff;
        }
        .node-header {
          display: flex;
          align-items: center;
          gap: 4px;
          cursor: pointer;
        }
        .node-directory .node-header:hover {
          color: #1d4ed8;
        }
        .toggle-icon {
          font-family: monospace;
          font-size: 0.8em;
          width: 16px;
          text-align: center;
          color: #6b7280;
        }
        .node-directory {
          font-weight: 600;
          color: #2563eb;
        }
        .node-children {
          margin-left: 20px;
        }
        .tree-controls {
          margin-bottom: 16px;
          display: flex;
          gap: 8px;
        }
        .tree-controls button {
          padding: 6px 12px;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          background: white;
          color: #374151;
          font-size: 0.875em;
          cursor: pointer;
          transition: all 0.2s;
        }
        .tree-controls button:hover {
          background: #f9fafb;
          border-color: #d1d5db;
        }
        .node-file {
          color: #374151;
        }
        .node-loc {
          font-size: 0.85em;
          color: #6b7280;
          margin-left: 8px;
        }
        .node-path {
          font-size: 0.8em;
          color: #9ca3af;
          margin-left: 16px;
          display: none;
        }
        .node:hover .node-path {
          display: inline;
        }
        .loc-summary {
          display: flex;
          gap: 32px;
          flex-wrap: wrap;
          margin-bottom: 24px;
        }
        .loc-total {
          font-size: 2em;
          font-weight: 700;
          color: #1a1a1a;
        }
        .loc-label {
          font-size: 0.85em;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .loc-breakdown {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 12px;
        }
        .extension-item {
          background: #f3f4f6;
          padding: 12px 16px;
          border-radius: 6px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .extension-name {
          font-weight: 600;
          color: #1a1a1a;
          font-family: 'Consolas', 'Monaco', monospace;
        }
        .extension-stats {
          text-align: right;
          font-size: 0.9em;
          color: #6b7280;
        }
        .file-content {
          margin: 16px 0;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          overflow: hidden;
        }
        .file-content-header {
          background: #f9fafb;
          padding: 12px 16px;
          border-bottom: 1px solid #e5e7eb;
          font-weight: 600;
          color: #374151;
          font-family: 'Consolas', 'Monaco', monospace;
          font-size: 0.9em;
        }
        .file-content-body {
          padding: 16px;
          background: #ffffff;
          overflow-x: auto;
        }
        .file-content-body pre {
          margin: 0;
          font-family: 'Consolas', 'Monaco', monospace;
          font-size: 0.85em;
          line-height: 1.5;
          white-space: pre-wrap;
        }
      </style>
    </head>
    <body>
      <div class="repository-header">
        <h1 class="repository-title">
          Repository Analysis
        </h1>
        <div class="metadata">
          <div class="metadata-item">
            <div class="metadata-label">Root Path</div>
            <div class="metadata-value"><xsl:value-of select="spl:repository/spl:metadata/spl:root"/></div>
          </div>
          <xsl:if test="spl:repository/spl:metadata/spl:includeDirs != ''">
            <div class="metadata-item">
              <div class="metadata-label">Include Directories</div>
              <div class="metadata-value"><xsl:value-of select="spl:repository/spl:metadata/spl:includeDirs"/></div>
            </div>
          </xsl:if>
          <xsl:if test="spl:repository/spl:metadata/spl:excludeDirs != ''">
            <div class="metadata-item">
              <div class="metadata-label">Exclude Directories</div>
              <div class="metadata-value"><xsl:value-of select="spl:repository/spl:metadata/spl:excludeDirs"/></div>
            </div>
          </xsl:if>
          <xsl:if test="spl:repository/spl:metadata/spl:fileExtensions != ''">
            <div class="metadata-item">
              <div class="metadata-label">File Extensions</div>
              <div class="metadata-value"><xsl:value-of select="spl:repository/spl:metadata/spl:fileExtensions"/></div>
            </div>
          </xsl:if>
          <xsl:if test="spl:repository/spl:metadata/spl:maxDepth">
            <div class="metadata-item">
              <div class="metadata-label">Max Depth</div>
              <div class="metadata-value"><xsl:value-of select="spl:repository/spl:metadata/spl:maxDepth"/></div>
            </div>
          </xsl:if>
        </div>
      </div>

      <xsl:if test="spl:repository/spl:locSummary">
        <div class="section">
          <h2 class="section-title">Lines of Code Summary</h2>
          <div class="loc-summary">
            <div>
              <div class="loc-total"><xsl:value-of select="spl:repository/spl:locSummary/spl:totalLoc"/></div>
              <div class="loc-label">Total Lines</div>
            </div>
          </div>
          <xsl:if test="spl:repository/spl:locSummary/spl:locBreakdown/spl:extension">
            <div class="loc-breakdown">
              <xsl:for-each select="spl:repository/spl:locSummary/spl:locBreakdown/spl:extension">
                <div class="extension-item">
                  <span class="extension-name"><xsl:value-of select="@spl:name"/></span>
                  <div class="extension-stats">
                    <div><xsl:value-of select="@spl:lines"/> lines</div>
                    <div><xsl:value-of select="@spl:files"/> files</div>
                  </div>
                </div>
              </xsl:for-each>
            </div>
          </xsl:if>
        </div>
      </xsl:if>

      <xsl:if test="spl:repository/spl:directoryTree">
        <div class="section">
          <h2 class="section-title">Directory Structure</h2>
          <div class="tree-controls">
            <button onclick="expandAll()">Expand All</button>
            <button onclick="collapseAll()">Collapse All</button>
          </div>
          <div class="tree">
            <xsl:apply-templates select="spl:repository/spl:directoryTree/spl:node"/>
          </div>
        </div>
      </xsl:if>

      <xsl:if test="spl:repository/spl:fileContents">
        <div class="section">
          <h2 class="section-title">File Contents</h2>
          <xsl:for-each select="spl:repository/spl:fileContents/spl:fileContent">
            <div class="file-content">
              <div class="file-content-header">
                <xsl:value-of select="@spl:path"/> (ID: <xsl:value-of select="@spl:id"/>)
              </div>
              <div class="file-content-body">
                <pre><xsl:value-of select="."/></pre>
              </div>
            </div>
          </xsl:for-each>
        </div>
      </xsl:if>
    </body>
  </html>
</xsl:template>

<xsl:template match="spl:node">
  <xsl:param name="indent" select="0"/>
  <xsl:variable name="nodeId" select="@spl:id"/>
  <xsl:variable name="hasChildren" select="count(spl:node) > 0"/>
  
  <div class="node" id="node-{$nodeId}">
    <xsl:choose>
      <xsl:when test="@spl:type = 'directory'">
        <div class="node-header" onclick="toggleNode('{$nodeId}')">
          <xsl:choose>
            <xsl:when test="$hasChildren">
              <span class="toggle-icon" id="toggle-{$nodeId}">▼</span>
            </xsl:when>
            <xsl:otherwise>
              <span class="toggle-icon" style="visibility: hidden;">▼</span>
            </xsl:otherwise>
          </xsl:choose>
          <span class="node-directory">📁 <xsl:value-of select="@spl:name"/>/</span>
          <xsl:if test="@spl:loc and @spl:loc != '0'">
            <span class="node-loc">[<xsl:value-of select="@spl:loc"/> LOC]</span>
          </xsl:if>
          <span class="node-path">(<xsl:value-of select="@spl:relativePath"/>)</span>
        </div>
      </xsl:when>
      <xsl:otherwise>
        <div class="node-header" style="margin-left: 20px;">
          <span class="toggle-icon" style="visibility: hidden;">▼</span>
          <span class="node-file">📄 <xsl:value-of select="@spl:name"/></span>
          <xsl:if test="@spl:loc and @spl:loc != '0'">
            <span class="node-loc">[<xsl:value-of select="@spl:loc"/> LOC]</span>
          </xsl:if>
          <span class="node-path">(<xsl:value-of select="@spl:relativePath"/>)</span>
        </div>
      </xsl:otherwise>
    </xsl:choose>
    
    <xsl:if test="$hasChildren">
      <div class="node-children" id="children-{$nodeId}" style="display: block;">
        <xsl:apply-templates select="spl:node">
          <xsl:with-param name="indent" select="$indent + 1"/>
        </xsl:apply-templates>
      </div>
    </xsl:if>
  </div>
</xsl:template>

</xsl:stylesheet>