"use client";

import { FolderArchive, ChevronRight } from "lucide-react";
import type { BlockViewProps } from "./types";
import { itemStrings } from "./types";

const CategoryListBlock = ({ block }: BlockViewProps) => {
  const { title } = block.content;
  const items = itemStrings(block);

  return (
    <div className="render-block portal-category-list-block" style={{ marginBottom: '20px' }}>
      <div 
        className="category-list-header" 
        style={{
          backgroundColor: '#005b8f', // Dark blue background as per the image
          color: '#ffffff',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontWeight: 'bold',
          fontSize: '16px',
          textTransform: 'uppercase'
        }}
      >
        <FolderArchive size={20} />
        <span style={{ flex: 1 }}>{title || "THÔNG TIN DANH MỤC"}</span>
      </div>
      <div 
        className="category-list-body" 
        style={{
          backgroundColor: '#f0f5f8', // Light blue/gray background
          padding: '0 16px',
        }}
      >
        {items.map((item, index) => (
          <div 
            key={index} 
            className="category-list-item"
            style={{
              padding: '12px 0',
              borderBottom: index < items.length - 1 ? '1px dashed #b5c7d3' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: '#333333',
              fontSize: '15px',
              cursor: 'pointer'
            }}
          >
            {/* Using a tiny triangle icon to mimic the image */}
            <div 
              style={{
                width: 0, 
                height: 0, 
                borderTop: '5px solid transparent', 
                borderBottom: '5px solid transparent', 
                borderLeft: '6px solid #c42026' // Red triangle
              }} 
            />
            <span style={{ flex: 1 }}>{item}</span>
          </div>
        ))}
        {items.length === 0 && (
          <div style={{ padding: '16px', color: '#666', fontStyle: 'italic', textAlign: 'center' }}>
            Chưa có danh mục nào
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryListBlock;
