export const KeyboardControlSettings = {
		kpSelectAll: {
			key: 'a',
			modifier: 'Control'
		},
		kpShift: {
			key: 'Shift',
			modifier: ''
		},
		kpCtrl: {
			key: 'Control',
			modifier: ''
		},
        kpAlt: {
            key: 'Alt',
            modifier: ''
        },
		kpCopy: {
			key: 'c',
			modifier: 'Control'
		},
		kpCut: {
			key: 'x',
			modifier: 'Control'
		},
		kpPaste: {
			key: 'v',
			modifier: 'Control'
		},
		kpUndo: {
			key: 'z',
			modifier: 'Control'
		},
		kpRedo: {
			key: 'y',
			modifier: 'Control'
		},
		kpDel: {
			key: 'Delete',
			modifier: ''
		},
        kpSidebarToggle: {
			key: 's',
			modifier: 'Control'
        },
        kpTransX: {
            key: 'z',
            modifier: 'Alt'
        },
        kpTransY: {
            key: 'a',
            modifier: 'Alt'
        }



} as Record<string, Record<string, string>>;

export const structEventType = {
    pointerdown: false,
    pointermove: false,
    pointerup: false,
    pointercancel: false,
    pointerenter: false,
    pointerover: false,
    pointerout: false,
    pointerleave: false,
    dblclick: false,
    canvasresize: false,
    wheel: false,
    onwheel: false,
    keydownevent: false,
    keyupevent: false,
    coreevent: false,
    eNone: false,
};

export const structClientType = {
    canvas: false,
    note: false,
    sidebar: false
};

export const structKeyEventType = {
    kpSelectAll: false,
    kpShift: false,
    kpCtrl: false,
    kpAlt: false,
    kpCopy: false,
    kpCut: false,
    kpPaste: false,
    kpUndo: false,
    kpRedo: false,
    kpDel: false,
    kpSidebarToggle: false,
    kpTransX: false,
    kpTransY: false,
    kpNone: false
};

export const StateModifierData = {
    isSnapping: true,
    isHovering: false,
    isCopying: false,
    isDragging: false,
    isResizing: false,
    isSelecting: false,
    notesDuplicated: false,
    notesTransformed: false,
    paneFocused: true
};
export const StateKeypressData = {
    kpShift: false,
    kpCtrl: false,
    kpAlt: false,
    kpTransX: false,
    kpTransY: false,
};