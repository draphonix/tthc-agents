# Upload Documentation Integration Plan

## Overview
This plan outlines the integration of the `UploadDocumentation` component into the `DocumentSubmissionArtifact` component with collapsible functionality.

## Current Components Analysis

### UploadDocumentation.tsx
- Full-featured document upload component with drag-and-drop
- File validation (PDF, DOCX, TXT, MD, Images up to 10MB)
- Upload processing with streaming response
- Display of extracted information
- Already has `isInChat` prop for compact display

### DocumentSubmissionArtifact.tsx
- Displays a list of required documents
- Shows document names in English and Vietnamese
- Indicates if a document is required with visual indicators
- Has a notes section

## Implementation Plan

### 1. Create a Collapsible Component
- Create a reusable `Collapsible` component in `apps/web/src/components/ui/collapsible.tsx`
- Should accept:
  - `title`: ReactNode for the header
  - `children`: ReactNode for the content
  - `defaultOpen?: boolean`: Initial state
  - `className?: string`: Additional styling
- Use state to track open/closed status
- Include a chevron icon that rotates when opened

### 2. Modify UploadDocumentation Component
- Add a `collapsed` prop to control visibility of extracted information
- Add a `onCollapseChange` callback to notify parent of state changes
- Modify the results display section to be conditionally rendered based on `collapsed` prop
- Add a header section with document name and collapse toggle
- Ensure the component works well when nested in the DocumentSubmissionArtifact

### 3. Update DocumentSubmissionArtifact Component
- Import the `UploadDocumentation` component
- For each document in the list, render a collapsible `UploadDocumentation` component
- Pass document name as a reason prop to UploadDocumentation
- Add state management to track which documents are collapsed/expanded
- Style the components to integrate seamlessly with the existing design
- Set `isInChat={true}` for compact display

### 4. State Management
- Add state to track upload status for each document
- Add state to track extracted information for each document
- Add state to track collapse/expand state for each document
- Use document index or ID as key for state management

### 5. Implementation Details

#### Collapsible Component Structure
```tsx
interface CollapsibleProps {
  title: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export function Collapsible({ title, children, defaultOpen = false, className }: CollapsibleProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div className={`border rounded-lg ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        {title}
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="p-4 border-t">
          {children}
        </div>
      )}
    </div>
  );
}
```

#### Modified UploadDocumentation Props
```tsx
interface UploadDocumentationProps {
  onUploadComplete?: (data: any) => void;
  className?: string;
  reason?: string;
  isInChat?: boolean;
  collapsed?: boolean;
  onCollapseChange?: (collapsed: boolean) => void;
  documentName?: string;
}
```

#### DocumentSubmissionArtifact Integration
```tsx
// For each document in the list
{docs.map((doc, idx) => (
  <Collapsible 
    key={idx} 
    title={
      <div className="flex items-center gap-2">
        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${doc.required ? "border-amber-400" : "border-border"}`}>
          {doc.required ? <span className="text-[10px]">!</span> : null}
        </div>
        <div>
          <div className="text-sm font-medium">{doc.name}</div>
          <div className="text-xs text-muted-foreground">{doc.nameVn}</div>
        </div>
      </div>
    }
    defaultOpen={false}
  >
    <UploadDocumentation
      reason={`upload ${doc.name}`}
      isInChat={true}
      documentName={doc.name}
      onUploadComplete={(data) => handleUploadComplete(idx, data)}
    />
  </Collapsible>
))}
```

## Testing Plan
1. Test collapsible functionality - ensure it expands/collapses correctly
2. Test document upload within each collapsible section
3. Verify extracted information displays correctly when expanded
4. Test multiple document uploads simultaneously
5. Verify styling matches existing design system
6. Test responsive behavior on different screen sizes

## Success Criteria
- Each document in DocumentSubmissionArtifact has an associated UploadDocumentation component
- UploadDocumentation component is collapsible by default
- When a document is uploaded, the component collapses to show only the document name
- Clicking on the collapsed component expands it to show the extracted information
- The integration maintains the existing styling and functionality of both components
- The solution works for multiple documents simultaneously