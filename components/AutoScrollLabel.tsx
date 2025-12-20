import React, { useState, useEffect, useRef } from 'react';

export const AutoScrollLabel = React.memo(({ text, className, style, forceHover }: any) => {
    const [isOverflowing, setIsOverflowing] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [isFirefox, setIsFirefox] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const textRef = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        setIsFirefox(typeof navigator !== 'undefined' && /firefox/i.test(navigator.userAgent));
    }, []);

    useEffect(() => {
        setIsOverflowing(false);
        setTimeout(() => {
            if (containerRef.current && textRef.current) {
                if (textRef.current.scrollWidth > containerRef.current.clientWidth) {
                    setIsOverflowing(true);
                }
            }
        }, 0);
    }, [text]);

    const active = forceHover !== undefined ? forceHover : isHovered;
    const showMarquee = active && isOverflowing;
    const duration = textRef.current ? (textRef.current.offsetWidth / 30 + 5) : 5;
    const gap = '2rem';

    const maskValue = showMarquee && !isFirefox
        ? 'linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%)'
        : 'none';

    return (
        <div
            ref={containerRef}
            className={className}
            style={{
                ...style,
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                position: 'relative',
                display: 'block',
                maskImage: maskValue,
                WebkitMaskImage: maskValue,
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div
                style={{
                    display: 'inline-flex',
                    width: showMarquee ? 'max-content' : '100%',
                    transform: 'translate3d(0, 0, 0)',
                    willChange: showMarquee ? 'transform' : undefined,
                    animation: showMarquee ? `marquee-scroll ${duration}s linear infinite` : 'none',
                    '--marquee-end': textRef.current ? `calc(-1 * (${textRef.current.offsetWidth}px + ${gap}))` : '0px'
                } as React.CSSProperties}
            >
                <span ref={textRef} style={{ display: 'block', textOverflow: showMarquee ? 'clip' : 'ellipsis', overflow: showMarquee ? 'visible' : 'hidden' }}>{text}</span>
                {showMarquee && (
                    <>
                        <span style={{ display: 'inline-block', width: gap, flexShrink: 0 }}></span>
                        <span>{text}</span>
                    </>
                )}
            </div>
        </div>
    );
});
