import React, { useState, useRef, useEffect, useCallback } from 'react'
import SignatureCanvas from 'react-signature-canvas'

// Load Pacifico font from Google Fonts
const FONT_LINK_ID = 'pacifico-font-link'
if (typeof document !== 'undefined' && !document.getElementById(FONT_LINK_ID)) {
    const link = document.createElement('link')
    link.id = FONT_LINK_ID
    link.rel = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=Pacifico&display=swap'
    document.head.appendChild(link)
}

const MODES = [
    { key: 'type', label: 'Type' },
    { key: 'draw', label: 'Draw' },
]

export default function SignatureField({
    value = '',
    onChange,
    label = 'Signature',
    disabled = false,
    penColor = '#1a1a2e',
    height = 160,
}) {
    const [mode, setMode] = useState('type')
    const [typedText, setTypedText] = useState('')
    const [canvasWidth, setCanvasWidth] = useState(300)
    const sigCanvasRef = useRef(null)
    const containerRef = useRef(null)
    const drawContainerRef = useRef(null)

    // Dynamically measure container width for responsive canvas
    useEffect(() => {
        function measure() {
            if (drawContainerRef.current) {
                const w = drawContainerRef.current.getBoundingClientRect().width - 16 // subtract padding
                setCanvasWidth(Math.max(200, Math.floor(w)))
            }
        }
        measure()
        window.addEventListener('resize', measure)
        return () => window.removeEventListener('resize', measure)
    }, [mode])

    // Pre-fill: if an existing value is provided, detect type
    useEffect(() => {
        if (value) {
            if (value.startsWith('data:image')) {
                setMode('draw')
            } else {
                setMode('type')
                setTypedText(value)
            }
        }
    }, [])

    // Notify parent on typed text change
    const handleTypedChange = useCallback(
        (e) => {
            const text = e.target.value
            setTypedText(text)
            onChange?.(text)
        },
        [onChange]
    )

    // When user finishes a stroke on the canvas
    const handleDrawEnd = useCallback(() => {
        if (sigCanvasRef.current && !sigCanvasRef.current.isEmpty()) {
            const base64 = sigCanvasRef.current.getTrimmedCanvas().toDataURL('image/png')
            onChange?.(base64)
        }
    }, [onChange])

    // Clear the canvas
    const handleClear = useCallback(() => {
        sigCanvasRef.current?.clear()
        onChange?.('')
    }, [onChange])

    // When switching modes, reset the other value
    const handleModeSwitch = useCallback(
        (newMode) => {
            setMode(newMode)
            if (newMode === 'type') {
                sigCanvasRef.current?.clear()
                onChange?.(typedText)
            } else {
                setTypedText('')
                onChange?.('')
            }
        },
        [onChange, typedText]
    )

    return (
        <div ref={containerRef} style={styles.wrapper}>
            {/* Label */}
            <label style={styles.label}>{label}</label>

            {/* Mode Tabs */}
            <div style={styles.tabRow}>
                {MODES.map((m) => (
                    <button
                        key={m.key}
                        type="button"
                        disabled={disabled}
                        onClick={() => handleModeSwitch(m.key)}
                        style={{
                            ...styles.tab,
                            ...(mode === m.key ? styles.tabActive : styles.tabInactive),
                            ...(disabled ? styles.tabDisabled : {}),
                        }}
                    >
                        {m.key === 'type' ? (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
                                <polyline points="4 7 4 4 20 4 20 7" />
                                <line x1="9" y1="20" x2="15" y2="20" />
                                <line x1="12" y1="4" x2="12" y2="20" />
                            </svg>
                        ) : (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
                                <path d="M12 19l7-7 3 3-7 7-3-3z" />
                                <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
                                <path d="M2 2l7.586 7.586" />
                                <circle cx="11" cy="11" r="2" />
                            </svg>
                        )}
                        {m.label}
                    </button>
                ))}
            </div>

            {/* Signature Area */}
            <div style={styles.canvasWrapper}>
                {mode === 'type' ? (
                    <div style={styles.typeContainer}>
                        <input
                            type="text"
                            value={typedText}
                            onChange={handleTypedChange}
                            placeholder="Type your full name..."
                            disabled={disabled}
                            style={styles.typeInput}
                            maxLength={80}
                        />
                        {/* Live preview */}
                        {typedText && (
                            <div style={styles.previewArea}>
                                <span style={styles.previewLabel}>Preview</span>
                                <div style={styles.signatureLine}>
                                    <span style={styles.typedPreview}>{typedText}</span>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div style={styles.drawContainer} ref={drawContainerRef}>
                        <SignatureCanvas
                            ref={sigCanvasRef}
                            penColor={penColor}
                            canvasProps={{
                                width: canvasWidth,
                                height: Math.min(height, 140),
                                style: styles.canvas,
                            }}
                            onEnd={handleDrawEnd}
                        />
                        {/* Signature baseline */}
                        <div style={styles.baselineDraw} />
                        <div style={styles.drawActions}>
                            <button
                                type="button"
                                onClick={handleClear}
                                disabled={disabled}
                                style={styles.clearBtn}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}>
                                    <polyline points="3 6 5 6 21 6" />
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                </svg>
                                Clear
                            </button>
                            <span style={styles.drawHint}>Draw your signature above</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

/* ---------- Inline styles ---------- */
const styles = {
    wrapper: {
        width: '100%',
        fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
    },
    label: {
        display: 'block',
        fontSize: 13,
        fontWeight: 600,
        color: '#334155',
        marginBottom: 8,
        letterSpacing: '0.01em',
    },
    tabRow: {
        display: 'flex',
        gap: 0,
        borderRadius: '10px 10px 0 0',
        overflow: 'hidden',
        border: '1px solid #e2e8f0',
        borderBottom: 'none',
    },
    tab: {
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '10px 0',
        fontSize: 13,
        fontWeight: 500,
        border: 'none',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        outline: 'none',
    },
    tabActive: {
        background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
        color: '#fff',
        boxShadow: '0 2px 8px rgba(249, 115, 22, 0.25)',
    },
    tabInactive: {
        background: '#f8fafc',
        color: '#64748b',
    },
    tabDisabled: {
        opacity: 0.5,
        cursor: 'not-allowed',
    },
    canvasWrapper: {
        border: '1px solid #e2e8f0',
        borderRadius: '0 0 10px 10px',
        background: '#fff',
        overflow: 'hidden',
    },
    /* ---- Type Mode ---- */
    typeContainer: {
        padding: 12,
    },
    typeInput: {
        width: '100%',
        padding: '10px 14px',
        fontSize: 14,
        border: '1.5px solid #e2e8f0',
        borderRadius: 8,
        outline: 'none',
        transition: 'border-color 0.2s',
        boxSizing: 'border-box',
        color: '#1e293b',
    },
    previewArea: {
        marginTop: 16,
        position: 'relative',
    },
    previewLabel: {
        position: 'absolute',
        top: -8,
        left: 12,
        background: '#fff',
        padding: '0 6px',
        fontSize: 10,
        fontWeight: 600,
        color: '#94a3b8',
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
    },
    signatureLine: {
        border: '1px dashed #cbd5e1',
        borderRadius: 8,
        padding: '24px 20px 16px',
        display: 'flex',
        alignItems: 'flex-end',
        minHeight: 70,
        background: 'repeating-linear-gradient(0deg, transparent, transparent 34px, #f1f5f9 34px, #f1f5f9 35px)',
    },
    typedPreview: {
        fontFamily: "'Pacifico', cursive",
        fontSize: 22,
        color: '#1a1a2e',
        lineHeight: 1.2,
        borderBottom: '2px solid #1e293b',
        paddingBottom: 4,
        display: 'inline-block',
        wordBreak: 'break-word',
        maxWidth: '100%',
    },
    /* ---- Draw Mode ---- */
    drawContainer: {
        position: 'relative',
        padding: '8px 8px 0',
    },
    canvas: {
        width: '100%',
        height: '100%',
        borderRadius: 6,
        cursor: 'crosshair',
        touchAction: 'none',
        display: 'block',
        background: 'repeating-linear-gradient(0deg, transparent, transparent 34px, #f1f5f9 34px, #f1f5f9 35px)',
    },
    baselineDraw: {
        position: 'absolute',
        left: 24,
        right: 24,
        bottom: 52,
        height: 2,
        background: '#cbd5e1',
        borderRadius: 1,
        pointerEvents: 'none',
    },
    drawActions: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 8px 10px',
    },
    clearBtn: {
        display: 'flex',
        alignItems: 'center',
        padding: '6px 14px',
        fontSize: 12,
        fontWeight: 500,
        color: '#ef4444',
        background: '#fef2f2',
        border: '1px solid #fecaca',
        borderRadius: 6,
        cursor: 'pointer',
        transition: 'all 0.15s',
    },
    drawHint: {
        fontSize: 11,
        color: '#94a3b8',
        fontStyle: 'italic',
    },
}
