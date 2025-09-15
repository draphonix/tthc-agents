# AI Assessment Page Artifacts Refactor Plan

## Overview
Refactor the existing AI assessment page from a state-based view switching system to a modern split-screen layout using Vercel AI SDK Artifacts. This will provide a better user experience with persistent chat conversation alongside contextual artifacts.

## Current vs New Architecture

### Current Flow
- Assessment questions (fullscreen) → Results (fullscreen) → Chat (fullscreen)
- Uses `ViewState` enum to switch between screens
- Conversation is lost when switching views
- Poor mobile experience with full screen transitions

### New Flow  
- Split screen: Chat (left 40%) + Artifacts (right 60%)
- Persistent conversation throughout entire flow
- Artifacts change contextually: Assessment Wizard → Results → Other artifacts
- Responsive design with mobile stacking

## ASCII Mockup

```
┌─────────────────────────────┬──────────────────────────────────────────────┐
│        ChatPanel (40%)      │           ArtifactsPanel (60%)               │
│─────────────────────────────┼──────────────────────────────────────────────│
│ ┌─────────────────────────┐ │ ┌──────────────────────────────────────────┐ │
│ │   AI Assistant Header   │ │ │    Assessment Questions Artifact        │ │
│ └─────────────────────────┘ │ │                                          │ │
│ ┌─────────────────────────┐ │ │  Q1: Is your baby born in Vietnam?      │ │
│ │ AI: Welcome! Let me     │ │ │  ○ Yes  ○ No                           │ │
│ │ help with birth reg...  │ │ │                                          │ │
│ └─────────────────────────┘ │ │  Q2: Was baby born in hospital?         │ │
│ ┌─────────────────────────┐ │ │  ○ Yes  ○ No                           │ │
│ │ User: I need help       │ │ │                                          │ │
│ └─────────────────────────┘ │ │  [Next Question]                         │ │
│ ┌─────────────────────────┐ │ └──────────────────────────────────────────┘ │
│ │ AI: Based on your       │ │                                              │
│ │ answers, here's what... │ │  (After completion, switches to:)           │
│ └─────────────────────────┘ │                                              │
│                             │ ┌──────────────────────────────────────────┐ │
│ (scrollable message area)   │ │    Assessment Results Artifact           │ │
│                             │ │                                          │ │
│ ┌─────────────────────────┐ │ │  Your Scenario: Born in hospital        │ │
│ │ Type your message...    │ │ │  Required Documents:                     │ │ 
│ │                    [→]  │ │ │  • Hospital birth certificate           │ │
│ └─────────────────────────┘ │ │  • Parent IDs                          │ │
└─────────────────────────────┴──────────────────────────────────────────────┘
```

## File Structure Changes

### New Files to Create
```
apps/web/src/
├── components/ai/
│   ├── layout/
│   │   ├── AIPageLayout.tsx           # Split-screen grid layout
│   │   ├── ChatPanel.tsx              # Chat UI component
│   │   └── ArtifactsPanel.tsx         # Wrapper for AI SDK Artifacts
│   ├── artifacts/
│   │   ├── AssessmentWizardArtifact.tsx    # Refactored assessment questions
│   │   └── AssessmentResultsArtifact.tsx   # Refactored results display
│   └── hooks/
│       └── useAssessmentArtifacts.ts       # Artifact state management
└── lib/
    └── types/
        └── ai-artifacts.ts                 # TypeScript definitions
```

### Files to Modify
```
apps/web/src/
├── app/ai/
│   └── page.tsx                       # Simplified to use new layout
├── components/ai/
│   ├── smart-assessment-ai.tsx        # DELETE or refactor to artifact
│   └── assessment-results.tsx         # DELETE or refactor to artifact
```

## Implementation Steps

### Phase 1: Foundation Setup
1. **Install Dependencies**
   - Verify `@ai-sdk/react` is available
   - Install AI Elements if needed: `npx ai-elements@latest add artifact`

2. **Create Type Definitions**
   - Define `ArtifactKind` enum with assessment-wizard, assessment-results
   - Create `AIAssistantArtifact` interface
   - Export types for artifact data structures

3. **Create Layout Components**
   - `AIPageLayout`: CSS Grid container with responsive breakpoints
   - `ChatPanel`: Extract chat UI from current page.tsx
   - `ArtifactsPanel`: Wrapper for Vercel AI SDK Artifacts component

### Phase 2: Artifact System
4. **Convert Assessment Components to Artifacts**
   - `AssessmentWizardArtifact`: Refactor existing SmartAssessmentAI
   - `AssessmentResultsArtifact`: Refactor existing AssessmentResults
   - Both components receive artifact data via props
   - Remove navigation/back buttons (handled by layout)

5. **Create Artifact State Management**
   - `useAssessmentArtifacts` hook
   - Manage array of artifacts with replace/add functionality
   - Handle wizard completion → results transition
   - Provide callbacks for artifact interactions

### Phase 3: Integration
6. **Refactor Main Page**
   - Remove `ViewState` enum and related logic
   - Remove view switching JSX conditions
   - Integrate new layout components
   - Connect artifact hook to components

7. **Update Chat Integration**
   - Preserve existing `useChat` functionality
   - Maintain upload documentation tool integration
   - Keep message streaming and auto-scroll
   - Update welcome message logic

### Phase 4: Polish & Cleanup
8. **Responsive Design**
   - Desktop: 40/60 split with minimum widths
   - Tablet: Adjustable split ratios
   - Mobile: Vertical stacking or tabs
   - Ensure artifacts remain usable on small screens

9. **Remove Legacy Code**
   - Delete unused view state management
   - Remove old component imports
   - Clean up handleBackToChat and related functions
   - Update imports throughout the application

10. **Testing & Validation**
    - Test complete assessment flow
    - Verify chat persistence during artifact transitions
    - Test responsive behavior across breakpoints
    - Validate Vietnamese language support
    - Test upload documentation integration

## Key Design Principles

### User Experience
- **Persistence**: Chat conversation never disappears
- **Context**: Users see both conversation and current task
- **Flow**: Seamless transition from assessment to results to continued chat
- **Accessibility**: Proper screen reader support and keyboard navigation

### Technical Architecture
- **Separation of Concerns**: Chat logic separate from artifact logic
- **Reusability**: Artifact system can be extended for future features
- **Performance**: Lazy loading of artifact components
- **Type Safety**: Full TypeScript support throughout

### Visual Design
- **Professional**: Clean, modern split-screen layout
- **Consistent**: Use existing shadcn/ui components
- **Responsive**: Adapts gracefully to all screen sizes
- **Vietnamese Support**: Proper font rendering and text direction

## Integration Points

### Server API
- No changes required to `/api/ai/process-assessment` endpoint
- Existing streaming response works with new artifact system
- RAG integration remains unchanged

### Chat System
- Preserve existing `useChat` from `@ai-sdk/react`
- Maintain message history and streaming
- Keep upload documentation tool integration
- Preserve Vietnamese language support

### Assessment Logic
- Reuse existing assessment question data
- Maintain scenario determination logic
- Keep RAG query integration
- Preserve answer validation

## Success Criteria

### Functional Requirements
- [ ] Assessment wizard renders in right panel on page load
- [ ] Chat conversation starts immediately in left panel
- [ ] Assessment completion triggers results artifact transition
- [ ] Chat continues after assessment completion
- [ ] Upload documentation works within chat
- [ ] All Vietnamese text displays correctly

### Technical Requirements
- [ ] No breaking changes to server API
- [ ] TypeScript compilation with no errors
- [ ] Responsive design works on all breakpoints
- [ ] Accessibility standards maintained
- [ ] Performance metrics maintained or improved

### User Experience Requirements
- [ ] Smooth artifact transitions without flickering
- [ ] Chat scroll behavior preserved
- [ ] Message auto-scroll continues working
- [ ] Back/forward browser navigation works correctly
- [ ] Mobile usability maintained or improved

## Timeline Estimate

- **Day 1**: Foundation setup, type definitions, layout components (6 hours)
- **Day 2**: Artifact system implementation, component refactoring (8 hours)
- **Day 3**: Integration, main page refactor, testing (6 hours)
- **Day 4**: Polish, responsive design, cleanup (4 hours)

**Total Effort**: ~3-4 working days

## Risk Mitigation

### Technical Risks
- **Artifact compatibility**: Test with multiple browsers and devices
- **State management**: Ensure artifact transitions don't cause memory leaks
- **Performance**: Monitor bundle size impact of AI SDK components

### UX Risks
- **Mobile usability**: Thorough testing on small screens
- **Accessibility**: Screen reader testing for split-screen layout
- **Vietnamese rendering**: Test font support and text direction

### Integration Risks
- **Chat persistence**: Verify message history survives artifact changes
- **Upload flow**: Ensure document upload doesn't break in new layout
- **Back-end compatibility**: Confirm streaming responses work with artifacts

## Future Enhancements

### Potential Artifacts
- Document upload preview artifact
- Registration timeline artifact
- Required documents checklist artifact
- Progress tracking artifact

### Advanced Features
- Artifact history/navigation
- Multiple concurrent artifacts
- Artifact sharing/export
- Custom artifact templates

This refactor will transform the assessment experience into a modern, professional AI assistant interface while maintaining all existing functionality and improving the overall user experience.
