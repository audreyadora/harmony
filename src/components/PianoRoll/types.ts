export type elementSlice = { type?: string; selected?: boolean; prevselected?: boolean };
export type StateModifiers = {
    isSnapping: boolean;
    isHovering: boolean;
    isCopying: boolean;
    isDragging: boolean;
    isResizing: boolean;
    isSelecting: boolean;
    notesDuplicated: boolean;
    notesTransformed: boolean;
    paneFocused: boolean;
}
export type StateKeypress = {
    kpShift: boolean;
    kpAlt: boolean;
    kpCtrl: boolean;
    kpTransX: boolean;
    kpTransY: boolean;
}
export type CType = 'canvas' | 'note' | 'sidebar';

export type CallbackKey = 
    'clickNote' |
    'clickCanvas' |
    'clickSidebar' |
    'canvasExit' |
    'doubleClickCanvas' |
    'doubleClickNote' |
    'duplicateNotes' |
    'transSelector' |
    'transNotes' |
    'resizeNotes' |
    'resetViewport' |
    'hoverNote' |
    'hoverCanvas' |
    'releaseSelector' |
    'releaseNotes' |
    'releaseNotes' |
    'zoomX' |
    'zoomY' |
    'zoomXY' |
    'transX' |
    'transY' |
    'kpEventSelectAll' |
    'kpEventControl' |
    'kpEventShift' |
    'kpEventAlt' |
    'kpEventCopy' |
    'kpEventCut' |
    'kpEventPaste' |
    'kpEventUndo' |
    'kpEventRedo' |
    'kpEventDelete' |
    'kpEventSidebarToggle' |
    'kuEventCtrl' |
    'kuEventShift' |
    'kuEventAlt' |
    'focus' |
    'loadData' |
    'modifyData';
export type StateSlice = {
	data?: {
		numSelectedNotes?: number;
		rowCount?: number;
		colCount?: number;
		startTime?: number;
		previousCursor?: {
			x?: number;
			y?: number;
		};
		startCursor?: { x?: number; y?: number };
		delta?: { x?: number; y?: number };
		clipboard?: { xa: number; xb: number; ya: number; yb: number }[];
		offset?: { x: number; y: number };
		scale?: { x: number; y: number };
		elements?: {
			wrapper?: string;
			canvas?: { w?: number; h?: number };
			selector?: string;
			gridcells?: string[];
			notedata?: { [x: string]: { xa: number; xb: number; ya: number; yb: number } };
			canvasdata?: { xa: number; xb: number; ya: number; yb: number };
			noteSelectState?: { [x: string]: boolean };
			notePrevSelectState?: { [x: string]: boolean };
		};
	};
	props?: {
		selector?: {
			borderStyle?: string;
		};
	};
	modifiers?: {
		isSnapping?: boolean;
		isHovering?: boolean;
		isCopying?: boolean;
		isDragging?: boolean;
		notesTransformed?: boolean;
		isResizing?: boolean;
		isSelecting?: boolean;
		notesDuplicated?: boolean;
		paneFocused?: boolean;
		currentTarget?: string;
	};
	keypress?: {
		kpSelectAll?: boolean;
		kpShift?: boolean;
		kpCtrl?: boolean;
        kpAlt?: boolean;
		kpCopy?: boolean;
		kpPaste?: boolean;
		kpUndo?: boolean;
		kpRedo?: boolean;
		kpDel?: boolean;
	};
};

export type StateData = {
	data: {
		rowCount: number;
		colCount: number;
		startTime: number;
		previousCursor: {
			x: number;
			y: number;
		};
		startCursor: { x: number; y: number };
		numSelectedNotes: number;
		delta: { x: number; y: number };
		clipboard: { xa: number; xb: number; ya: number; yb: number }[];
		offset: { x: number; y: number };
		scale: { x: number; y: number };
		elements: {
			wrapper: string;
			canvas: { w: number; h: number };
			selector: string;
			gridcells: string[];
			notedata: { [x: string]: { xa: number; xb: number; ya: number; yb: number } };
			canvasdata: { xa: number; xb: number; ya: number; yb: number };
			noteSelectState: { [x: string]: boolean };
			notePrevSelectState: { [x: string]: boolean };
		};
	};
	props: {
		selector: {
			border: string;
		};
	};
	modifiers: {
		isSnapping: boolean;
		isHovering: boolean;
		isCopying: boolean;
		isDragging: boolean;
		notesTransformed: boolean;
		isResizing: boolean;
		isSelecting: boolean;
		notesDuplicated: boolean;
		paneFocused: boolean;
		currentTarget: string;
	};
	keypress: {
		kpSelectAll: boolean;
		kpShift: boolean;
		kpCtrl: boolean;
        kpAlt: boolean;
		kpCopy: boolean;
		kpPaste: boolean;
		kpUndo: boolean;
		kpRedo: boolean;
		kpDel: boolean;
	};
};
export type Modifiers = {
    isSnapping: boolean;
    isHovering: boolean;
    isCopying: boolean;
    isDragging: boolean;
    notesTransformed: boolean;
    isResizing: boolean;
    isSelecting: boolean;
    notesDuplicated: boolean;
    paneFocused: boolean;
}
export type PointVec = {
	x: number;
	y: number;
};
export type RectVec = {
	xa: number;
	xb: number;
	ya: number;
	yb: number;
};
export type RectVecArrays = {
    xa: number[];
	xb: number[];
	ya: number[];
	yb: number[];
}
export type ElementPointVecMap = Record<string, PointVec>;
export type ElementRectVecMap = Record<string, RectVec>;
export type ElementSelectMap = Record<string, boolean>;
export type ElementClipboardList = RectVec[];

export type StateUpdate = {
	state?: {
		stateIDMap?: {
			elementIDList?: string[];
			currentTarget?: string;
		};
		statePointVecMap?: {
			cursorStart?: PointVec;
			cursorDelta?: PointVec;
			canvasOffset?: PointVec;
			canvasScale?: PointVec;
		};
		stateRectVecMap?: {
			clipboard?: RectVec[];
			canvasRect?: RectVec;
			noteRectMap?:Record<string, RectVec>
		};
		stateSelectStateMap?: {
			noteSelectStateMap?: Record<string | number, boolean>
			notePrevSelectStateMap?: Record<string | number, boolean>
		};
		stateModifiersMap?: {
			isSnapping?: boolean;
			isHovering?: boolean;
			isCopying?: boolean;
			isDragging?: boolean;
			isResizing?: boolean;
			isSelecting?: boolean;
			notesDuplicated?: boolean;
			notesTransformed?: boolean;
			paneFocused?: boolean;
		};
		stateKeypressMap?: {
			kpSelectAll?: boolean;
			kpShift?: boolean;
			kpCtrl?: boolean;
            kpAlt?: boolean;
			kpCopy?: boolean;
			kpPaste?: boolean;
			kpUndo?: boolean;
			kpRedo?: boolean;
			kpDel?: boolean;
		};
		statePropsMap?: {
			rowCount?: number;
			colCount?: number;
			startTime?: number;
		};
	};
	targetStyles?: TargetStyles;
	action?: {
		commitDivsArray?: HTMLElement[];
		deleteElements?: string[];
		setNoteWidth?: string;
	};
};
export type Mid = {
	pitch: number;
	offset: number;
	duration: number;
};
export type EType = 
    | 'pointerdown'
    | 'pointermove'
    | 'pointerup'
    | 'pointercancel'
    | 'pointerenter'
    | 'pointerover'
    | 'pointerout'
    | 'pointerleave'
    | 'dblclick'
    | 'canvasresize'
    | 'keydownevent'
    | 'keyupevent'
    | 'coreevent'
    | 'wheel'
    | 'onwheel'
    | 'eNone';
export type KType = 
| 'kpSelectAll'
| 'kpShift'
| 'kpCtrl'
| 'kpAlt'
| 'kpCopy'
| 'kpCut'
| 'kpPaste'
| 'kpUndo'
| 'kpRedo'
| 'kpDel'
| 'kpNone'
| 'kpTransX'
| 'kpTransY';
export type EventHandlerProps = {
	targetID: string;
	cType: 'canvas' | 'note'|'sidebar';
	eType: EType;
	kType:KType;
	cursor: PointVec;
    stateModifiers: StateModifiers;
    stateKeypress: StateKeypress;
};
export type Action = { type: string; data: EventData };

export type TargetStyles = {
	id: string;
	style: Record<string, string>;
}[];
export type noteArr = {
	id: string;
	x: number;
	y: number;
	width: number;
	height: number;
	selected: boolean;
}[];
export type EventData = {
    targetID: string;
    cursor: PointVec;
    cType: 'canvas' | 'note'|'sidebar';
    eType: EType;
    kType: KType;
}


export type GridDataGenerator = {
    canvas_scale?: number[];
    canvas_trans?: number[];
    grid_scale_x?: number;

    g_color_a?: number[];
    g_color_b?: number[];
    g_color_c?: number[];
    g_color_d?: number[];

    border_px?: number;
    music_scale?: number[];
    grid_color_interval?: number;

    grid_zoom_divider?: number;
    grid_time_div?: number;
    grid_measures?: number
    grid_range?: {xa: number; xb: number; ya: number; yb: number};
    canvas_range?: {xa: number; xb: number; ya: number; yb: number};
    offset_x?: number;
}

export type NoteProps= {
    note_color_selected?: [number, number, number, number];
    note_color_unselected?: [number, number, number, number];
    border_px?: number;
    corner_radius?: number;
    snap_trans_x?: boolean,
    snap_trans_y?: boolean,
    snap_resize_x?: boolean;
    float_length?: number;
}

export type NoteDataProps = {
    note_color_selected: number[];
    note_color_unselected: number[];
    border_px: number;
    corner_radius: number;
    snap_trans_x: boolean;
    snap_trans_y: boolean;
    snap_resize_x: boolean;
    float_length: number;
    resize_bounds: number;
};
export type NoteData = {
    note_render_data: Float32Array;
    note_render_data_length: number;
    start_cursor: {
        x: number;
        y: number;
    };
    visible_note_count: number;
    render_state: boolean;
}