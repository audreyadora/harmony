import type {EventHandlerProps, CallbackKey} from './types'
import {structEventType,structClientType,structKeyEventType} from './Constants'
export function EventPipeline(data: EventHandlerProps) {
    const eventType = {...structEventType, ...Object.fromEntries([[data.eType, true]])};
    const clientType = {...structClientType, ...Object.fromEntries([[data.cType, true]])};
    const keyEventType = {...structKeyEventType, ...Object.fromEntries([[data.kType, true]])}; 
    const modifiers = {...data.stateModifiers};
    const keypress = {...data.stateKeypress};
    const eventData = {targetID: data.targetID, cursor: data.cursor} 

    let callbackKey = ''
    if (eventType.pointerdown) {
        if (clientType.note) {
            callbackKey = 'clickNote'
        } else 
        if (clientType.canvas) {
            callbackKey = 'clickCanvas'
        } else 
        if (clientType.sidebar) {
            callbackKey = 'clickSidebar'
        }
    } else if (eventType.dblclick) {
        if (clientType.canvas) {
            if (keypress.kpCtrl) {
                callbackKey='resetViewport'
            } else {
                callbackKey='doubleClickCanvas'
            }
        } else if (clientType.note) {
            callbackKey='doubleClickNote'
        }
    
    } else 
    if (eventType.wheel) {
        if (keypress.kpCtrl) {
            callbackKey='zoomY'
        } else
        if (keypress.kpShift) {
            callbackKey='zoomX'
        } else 
        if (keypress.kpTransX) {
            callbackKey='transX'
        } else 
        if (keypress.kpTransY) {
            callbackKey='transY'
        } else {
            callbackKey='zoomXY'
        }
        
    }
    if (eventType.pointermove || eventType.pointerenter || eventType.pointerover) {
            if (modifiers.isCopying && !modifiers.notesDuplicated && !modifiers.isResizing) {
                callbackKey = 'duplicateNotes'
            } else if (modifiers.isSelecting) {
                callbackKey = 'transSelector'
            } else if (modifiers.isDragging) {
                callbackKey = 'transNotes'
            } else if (modifiers.isResizing) {
                callbackKey = 'resizeNotes'
            } else if (clientType.note) {
                callbackKey = 'hoverNote'
            } else if (clientType.canvas) {
                callbackKey = 'hoverCanvas'
            }
    } else if (eventType.pointerup || eventType.pointercancel) {
        if (modifiers.isSelecting) {
            callbackKey = 'releaseSelector' 
        } else if (modifiers.isDragging) {
            callbackKey = 'releaseNotes'
        } else if (modifiers.isResizing) {
            callbackKey = 'releaseNotes'
        }
    } else if (eventType.pointerout || eventType.pointerleave) {
            callbackKey = 'canvasExit'
    } else if (eventType.keydownevent && modifiers.paneFocused) {
        if (keyEventType.kpSelectAll) {
            callbackKey = 'kpEventSelectAll'
        } else if (keyEventType.kpCtrl) {
            callbackKey = 'kpEventControl'
        } else if (keyEventType.kpShift) {
            callbackKey = 'kpEventShift'
        } else if (keyEventType.kpCopy) {
            callbackKey = 'kpEventCopy'
        } else if (keyEventType.kpCut) {
            callbackKey = 'kpEventCut'
        } else if (keyEventType.kpPaste) {
            callbackKey = 'kpEventPaste'
        } else if (keyEventType.kpUndo) {
            callbackKey = 'kpEventUndo'
        } else if (keyEventType.kpRedo) {
            callbackKey = 'kpEventRedo'
        } else if (keyEventType.kpDel) {
            callbackKey = 'kpEventDelete'
        } else if (keyEventType.kpSidebarToggle) {
            callbackKey = 'kpEventSidebarToggle'
        } else if (keyEventType.kpTransX) {
            callbackKey = 'kpEventTransX'
        } else if (keyEventType.kpTransY) {
            callbackKey = 'kpEventTransY'
        }
    } else if (eventType.keyupevent && modifiers.paneFocused) {
        if (keyEventType.kpCtrl) {
            callbackKey = 'kuEventCtrl'
        } else if (keyEventType.kpShift) {
            callbackKey = 'kuEventShift'
        } else if (keyEventType.kpTransX) {
            callbackKey = 'kuEventTransX'
        } else if (keyEventType.kpTransY) {
            callbackKey = 'kuEventTransY'
        }
    } else if (eventType.coreevent && modifiers.paneFocused) {
        if (keyEventType.kpCopy) {
            callbackKey = 'focus'
        } else if (keyEventType.kpPaste) {
            callbackKey = 'loadData'
        } else if (keyEventType.kpUndo) {
            callbackKey = 'modifyData'
        }
    } 
    
    if (callbackKey !== '') {
        return {
            eventData: eventData,
            stateModifiers: modifiers,
            stateKeypress: keypress,
            callbackKey: callbackKey as CallbackKey
        }
    } else {

        return false;
    }
}