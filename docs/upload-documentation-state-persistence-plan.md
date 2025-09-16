# Upload Documentation State Persistence Plan

## Problem Analysis

The `UploadDocumentation` component loses its state when collapsed and re-expanded because:
1. The component is used within a `Collapsible` component
2. When collapsed, the `Collapsible` unmounts its children
3. When reopened, a new instance of `UploadDocumentation` is created with empty state
4. Internal state (files, messages, errors, upload status) is lost

## Current State Management

The `UploadDocumentation` component currently manages these internal states:
- `files`: Array of selected files
- `isUploading`: Boolean indicating upload progress
- `error`: Error message string
- `messages`: Array of chat messages from AI extraction

## Solution Design

### Approach: State Lifting

We'll lift the state management from `UploadDocumentation` to its parent component (`DocumentSubmissionArtifact`), which persists even when the collapsible is closed.

### 1. Define Upload State Interface

Add to `apps/web/src/lib/types/ai-artifacts.ts`:

```typescript
export interface DocumentUploadState {
  files: File[];
  isUploading: boolean;
  error: string | null;
  messages: any[]; // Using any for now, could be typed more specifically
}
```

### 2. Modify DocumentSubmissionArtifact

Update `apps/web/src/components/ai/artifacts/DocumentSubmissionArtifact.tsx`:

1. Add state management for each document's upload state:
```typescript
// State to track upload state for each document
const [uploadStates, setUploadStates] = useState<Record<number, DocumentUploadState>>({});
```

2. Add handlers to update the upload state:
```typescript
// Initialize upload state for a document
const initUploadState = (index: number) => {
  if (!uploadStates[index]) {
    setUploadStates(prev => ({
      ...prev,
      [index]: {
        files: [],
        isUploading: false,
        error: null,
        messages: []
      }
    }));
  }
};

// Update files for a document
const updateFiles = (index: number, files: File[]) => {
  setUploadStates(prev => ({
    ...prev,
    [index]: {
      ...prev[index],
      files
    }
  }));
};

// Update uploading status for a document
const setUploading = (index: number, isUploading: boolean) => {
  setUploadStates(prev => ({
    ...prev,
    [index]: {
      ...prev[index],
      isUploading
    }
  }));
};

// Update error for a document
const setError = (index: number, error: string | null) => {
  setUploadStates(prev => ({
    ...prev,
    [index]: {
      ...prev[index],
      error
    }
  }));
};

// Update messages for a document
const setMessages = (index: number, messages: any[]) => {
  setUploadStates(prev => ({
    ...prev,
    [index]: {
      ...prev[index],
      messages
    }
  }));
};

// Reset upload state for a document
const resetUploadState = (index: number) => {
  setUploadStates(prev => ({
    ...prev,
    [index]: {
      files: [],
      isUploading: false,
      error: null,
      messages: []
    }
  }));
};
```

3. Pass state and handlers to UploadDocumentation:
```typescript
<UploadDocumentation
  reason={`upload ${doc.name}`}
  isInChat={true}
  documentName={doc.name}
  collapsed={collapsedStates[idx] || false}
  onCollapseChange={(collapsed) => handleCollapseChange(idx, collapsed)}
  // Pass state as props
  files={uploadStates[idx]?.files || []}
  isUploading={uploadStates[idx]?.isUploading || false}
  error={uploadStates[idx]?.error || null}
  messages={uploadStates[idx]?.messages || []}
  // Pass state update handlers
  onFilesChange={(files) => updateFiles(idx, files)}
  onUploadingChange={(isUploading) => setUploading(idx, isUploading)}
  onErrorChange={(error) => setError(idx, error)}
  onMessagesChange={(messages) => setMessages(idx, messages)}
  onReset={() => resetUploadState(idx)}
/>
```

### 3. Modify UploadDocumentation Component

Update `apps/web/src/components/UploadDocumentation.tsx`:

1. Add new props to the interface:
```typescript
interface UploadDocumentationProps {
  // Existing props
  onUploadComplete?: (data: any) => void;
  className?: string;
  reason?: string;
  isInChat?: boolean;
  collapsed?: boolean;
  onCollapseChange?: (collapsed: boolean) => void;
  documentName?: string;
  
  // New props for external state management
  files?: File[];
  isUploading?: boolean;
  error?: string | null;
  messages?: any[];
  onFilesChange?: (files: File[]) => void;
  onUploadingChange?: (isUploading: boolean) => void;
  onErrorChange?: (error: string | null) => void;
  onMessagesChange?: (messages: any[]) => void;
  onReset?: () => void;
}
```

2. Modify component to use external state when provided:
```typescript
export function UploadDocumentation({
  onUploadComplete,
  className = "",
  reason = "",
  isInChat = false,
  collapsed = false,
  onCollapseChange,
  documentName,
  // External state props
  files: externalFiles,
  isUploading: externalIsUploading,
  error: externalError,
  messages: externalMessages,
  onFilesChange,
  onUploadingChange,
  onErrorChange,
  onMessagesChange,
  onReset
}: UploadDocumentationProps) {
  // Use external state if provided, otherwise use internal state
  const useExternalState = externalFiles !== undefined && 
                          externalIsUploading !== undefined && 
                          externalError !== undefined && 
                          externalMessages !== undefined &&
                          onFilesChange && 
                          onUploadingChange && 
                          onErrorChange && 
                          onMessagesChange;
  
  const [internalFiles, setInternalFiles] = useState<File[]>([]);
  const [internalIsUploading, setInternalIsUploading] = useState(false);
  const [internalError, setInternalError] = useState<string | null>(null);
  const [internalMessages, setInternalMessages] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Use external or internal state
  const files = useExternalState ? externalFiles! : internalFiles;
  const isUploading = useExternalState ? externalIsUploading! : internalIsUploading;
  const error = useExternalState ? externalError! : internalError;
  const messages = useExternalState ? externalMessages! : internalMessages;
  
  // Use external or internal state setters
  const setFiles = useExternalState ? onFilesChange! : setInternalFiles;
  const setUploading = useExternalState ? onUploadingChange! : setInternalIsUploading;
  const setError = useExternalState ? onErrorChange! : setInternalError;
  const setMessages = useExternalState ? onMessagesChange! : setInternalMessages;
  
  // Rest of the component remains the same, using the state variables defined above
  // ...
}
```

3. Update the resetUpload function:
```typescript
const resetUpload = () => {
  if (useExternalState && onReset) {
    onReset();
  } else {
    setFiles([]);
    setError(null);
    setMessages([]);
  }
  // Expand when resetting
  if (onCollapseChange) {
    onCollapseChange(false);
  }
};
```

## Implementation Steps

1. Add the `DocumentUploadState` interface to `apps/web/src/lib/types/ai-artifacts.ts`
2. Modify `DocumentSubmissionArtifact` to manage upload state for each document
3. Update `UploadDocumentation` to accept and use external state when provided
4. Test the solution to ensure state persists across collapses

## Benefits of This Approach

1. **State Persistence**: Upload state is maintained even when the component is collapsed
2. **Backward Compatibility**: The component can still work with internal state if external state is not provided
3. **Separation of Concerns**: State management is moved to a more appropriate level
4. **Reusability**: The component remains reusable in different contexts

## Testing Considerations

1. Test that files are preserved when collapsing and expanding
2. Test that messages are preserved when collapsing and expanding
3. Test that error states are preserved when collapsing and expanding
4. Test that upload progress is preserved when collapsing and expanding
5. Test that the reset functionality works correctly
6. Test that the component still works when used without external state