import * as tslib_1 from "tslib";
import { Component, EventEmitter, Input, Output, Inject, ElementRef } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { timer } from 'rxjs';
export class CircleProgressOptions {
    constructor() {
        this.class = '';
        this.backgroundGradient = false;
        this.backgroundColor = 'transparent';
        this.backgroundGradientStopColor = 'transparent';
        this.backgroundOpacity = 1;
        this.backgroundStroke = 'transparent';
        this.backgroundStrokeWidth = 0;
        this.backgroundPadding = 5;
        this.percent = 0;
        this.radius = 90;
        this.space = 4;
        this.toFixed = 0;
        this.maxPercent = 1000;
        this.renderOnClick = true;
        this.units = '%';
        this.unitsFontSize = '10';
        this.unitsFontWeight = 'normal';
        this.unitsColor = '#444444';
        this.outerStrokeGradient = false;
        this.outerStrokeWidth = 8;
        this.outerStrokeColor = '#78C000';
        this.outerStrokeGradientStopColor = 'transparent';
        this.outerStrokeLinecap = 'round';
        this.innerStrokeColor = '#C7E596';
        this.innerStrokeWidth = 4;
        this.titleFormat = undefined;
        this.title = 'auto';
        this.titleColor = '#444444';
        this.titleFontSize = '20';
        this.titleFontWeight = 'normal';
        this.subtitleFormat = undefined;
        this.subtitle = 'progress';
        this.subtitleColor = '#A9A9A9';
        this.subtitleFontSize = '10';
        this.subtitleFontWeight = 'normal';
        this.imageSrc = undefined;
        this.imageHeight = undefined;
        this.imageWidth = undefined;
        this.animation = true;
        this.animateTitle = true;
        this.animateSubtitle = false;
        this.animationDuration = 500;
        this.showTitle = true;
        this.showSubtitle = true;
        this.showUnits = true;
        this.showImage = false;
        this.showBackground = true;
        this.showInnerStroke = true;
        this.clockwise = true;
        this.responsive = false;
        this.startFromZero = true;
        this.showZeroOuterStroke = true;
        this.lazy = false;
    }
}
/** @dynamic Prevent compiling error when using type `Document` https://github.com/angular/angular/issues/20351 */
let CircleProgressComponent = class CircleProgressComponent {
    constructor(defaultOptions, elRef, document) {
        this.elRef = elRef;
        this.document = document;
        this.onClick = new EventEmitter();
        // <svg> of component
        this.svgElement = null;
        // whether <svg> is in viewport
        this.isInViewport = false;
        // event for notifying viewport change caused by scrolling or resizing
        this.onViewportChanged = new EventEmitter;
        this._viewportChangedSubscriber = null;
        this.options = new CircleProgressOptions();
        this.defaultOptions = new CircleProgressOptions();
        this._lastPercent = 0;
        this._gradientUUID = null;
        this.render = () => {
            this.applyOptions();
            if (this.options.lazy) {
                // Draw svg if it doesn't exist
                this.svgElement === null && this.draw(this._lastPercent);
                // Draw it only when it's in the viewport
                if (this.isInViewport) {
                    // Draw it at the latest position when I am in.
                    if (this.options.animation && this.options.animationDuration > 0) {
                        this.animate(this._lastPercent, this.options.percent);
                    }
                    else {
                        this.draw(this.options.percent);
                    }
                    this._lastPercent = this.options.percent;
                }
            }
            else {
                if (this.options.animation && this.options.animationDuration > 0) {
                    this.animate(this._lastPercent, this.options.percent);
                }
                else {
                    this.draw(this.options.percent);
                }
                this._lastPercent = this.options.percent;
            }
        };
        this.polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
            let angleInRadius = angleInDegrees * Math.PI / 180;
            let x = centerX + Math.sin(angleInRadius) * radius;
            let y = centerY - Math.cos(angleInRadius) * radius;
            return { x: x, y: y };
        };
        this.draw = (percent) => {
            // make percent reasonable
            percent = (percent === undefined) ? this.options.percent : Math.abs(percent);
            // circle percent shouldn't be greater than 100%.
            let circlePercent = (percent > 100) ? 100 : percent;
            // determine box size
            let boxSize = this.options.radius * 2 + this.options.outerStrokeWidth * 2;
            if (this.options.showBackground) {
                boxSize += (this.options.backgroundStrokeWidth * 2 + this.max(0, this.options.backgroundPadding * 2));
            }
            // the centre of the circle
            let centre = { x: boxSize / 2, y: boxSize / 2 };
            // the start point of the arc
            let startPoint = { x: centre.x, y: centre.y - this.options.radius };
            // get the end point of the arc
            let endPoint = this.polarToCartesian(centre.x, centre.y, this.options.radius, 360 * (this.options.clockwise ?
                circlePercent :
                (100 - circlePercent)) / 100); // ####################
            // We'll get an end point with the same [x, y] as the start point when percent is 100%, so move x a little bit.
            if (circlePercent === 100) {
                endPoint.x = endPoint.x + (this.options.clockwise ? -0.01 : +0.01);
            }
            // largeArcFlag and sweepFlag
            let largeArcFlag, sweepFlag;
            if (circlePercent > 50) {
                [largeArcFlag, sweepFlag] = this.options.clockwise ? [1, 1] : [1, 0];
            }
            else {
                [largeArcFlag, sweepFlag] = this.options.clockwise ? [0, 1] : [0, 0];
            }
            // percent may not equal the actual percent
            let titlePercent = this.options.animateTitle ? percent : this.options.percent;
            let titleTextPercent = titlePercent > this.options.maxPercent ?
                `${this.options.maxPercent.toFixed(this.options.toFixed)}+` : titlePercent.toFixed(this.options.toFixed);
            let subtitlePercent = this.options.animateSubtitle ? percent : this.options.percent;
            // get title object
            let title = {
                x: centre.x,
                y: centre.y,
                textAnchor: 'middle',
                color: this.options.titleColor,
                fontSize: this.options.titleFontSize,
                fontWeight: this.options.titleFontWeight,
                texts: [],
                tspans: []
            };
            // from v0.9.9, both title and titleFormat(...) may be an array of string.
            if (this.options.titleFormat !== undefined && this.options.titleFormat.constructor.name === 'Function') {
                let formatted = this.options.titleFormat(titlePercent);
                if (formatted instanceof Array) {
                    title.texts = [...formatted];
                }
                else {
                    title.texts.push(formatted.toString());
                }
            }
            else {
                if (this.options.title === 'auto') {
                    title.texts.push(titleTextPercent);
                }
                else {
                    if (this.options.title instanceof Array) {
                        title.texts = [...this.options.title];
                    }
                    else {
                        title.texts.push(this.options.title.toString());
                    }
                }
            }
            // get subtitle object
            let subtitle = {
                x: centre.x,
                y: centre.y,
                textAnchor: 'middle',
                color: this.options.subtitleColor,
                fontSize: this.options.subtitleFontSize,
                fontWeight: this.options.subtitleFontWeight,
                texts: [],
                tspans: []
            };
            // from v0.9.9, both subtitle and subtitleFormat(...) may be an array of string.
            if (this.options.subtitleFormat !== undefined && this.options.subtitleFormat.constructor.name === 'Function') {
                let formatted = this.options.subtitleFormat(subtitlePercent);
                if (formatted instanceof Array) {
                    subtitle.texts = [...formatted];
                }
                else {
                    subtitle.texts.push(formatted.toString());
                }
            }
            else {
                if (this.options.subtitle instanceof Array) {
                    subtitle.texts = [...this.options.subtitle];
                }
                else {
                    subtitle.texts.push(this.options.subtitle.toString());
                }
            }
            // get units object
            let units = {
                text: `${this.options.units}`,
                fontSize: this.options.unitsFontSize,
                fontWeight: this.options.unitsFontWeight,
                color: this.options.unitsColor
            };
            // get total count of text lines to be shown
            let rowCount = 0, rowNum = 1;
            this.options.showTitle && (rowCount += title.texts.length);
            this.options.showSubtitle && (rowCount += subtitle.texts.length);
            // calc dy for each tspan for title
            if (this.options.showTitle) {
                for (let span of title.texts) {
                    title.tspans.push({ span: span, dy: this.getRelativeY(rowNum, rowCount) });
                    rowNum++;
                }
            }
            // calc dy for each tspan for subtitle
            if (this.options.showSubtitle) {
                for (let span of subtitle.texts) {
                    subtitle.tspans.push({ span: span, dy: this.getRelativeY(rowNum, rowCount) });
                    rowNum++;
                }
            }
            // create ID for gradient element
            if (null === this._gradientUUID) {
                this._gradientUUID = this.uuid();
            }
            // Bring it all together
            this.svg = {
                viewBox: `0 0 ${boxSize} ${boxSize}`,
                // Set both width and height to '100%' if it's responsive
                width: this.options.responsive ? '100%' : boxSize,
                height: this.options.responsive ? '100%' : boxSize,
                backgroundCircle: {
                    cx: centre.x,
                    cy: centre.y,
                    r: this.options.radius + this.options.outerStrokeWidth / 2 + this.options.backgroundPadding,
                    fill: this.options.backgroundColor,
                    fillOpacity: this.options.backgroundOpacity,
                    stroke: this.options.backgroundStroke,
                    strokeWidth: this.options.backgroundStrokeWidth,
                },
                path: {
                    // A rx ry x-axis-rotation large-arc-flag sweep-flag x y (https://developer.mozilla.org/en/docs/Web/SVG/Tutorial/Paths#Arcs)
                    d: `M ${startPoint.x} ${startPoint.y}
        A ${this.options.radius} ${this.options.radius} 0 ${largeArcFlag} ${sweepFlag} ${endPoint.x} ${endPoint.y}`,
                    stroke: this.options.outerStrokeColor,
                    strokeWidth: this.options.outerStrokeWidth,
                    strokeLinecap: this.options.outerStrokeLinecap,
                    fill: 'none'
                },
                circle: {
                    cx: centre.x,
                    cy: centre.y,
                    r: this.options.radius - this.options.space - this.options.outerStrokeWidth / 2 - this.options.innerStrokeWidth / 2,
                    fill: 'none',
                    stroke: this.options.innerStrokeColor,
                    strokeWidth: this.options.innerStrokeWidth,
                },
                title: title,
                units: units,
                subtitle: subtitle,
                image: {
                    x: centre.x - this.options.imageWidth / 2,
                    y: centre.y - this.options.imageHeight / 2,
                    src: this.options.imageSrc,
                    width: this.options.imageWidth,
                    height: this.options.imageHeight,
                },
                outerLinearGradient: {
                    id: 'outer-linear-' + this._gradientUUID,
                    colorStop1: this.options.outerStrokeColor,
                    colorStop2: this.options.outerStrokeGradientStopColor === 'transparent' ? '#FFF' : this.options.outerStrokeGradientStopColor,
                },
                radialGradient: {
                    id: 'radial-' + this._gradientUUID,
                    colorStop1: this.options.backgroundColor,
                    colorStop2: this.options.backgroundGradientStopColor === 'transparent' ? '#FFF' : this.options.backgroundGradientStopColor,
                }
            };
        };
        this.getAnimationParameters = (previousPercent, currentPercent) => {
            const MIN_INTERVAL = 10;
            let times, step, interval;
            let fromPercent = this.options.startFromZero ? 0 : (previousPercent < 0 ? 0 : previousPercent);
            let toPercent = currentPercent < 0 ? 0 : this.min(currentPercent, this.options.maxPercent);
            let delta = Math.abs(Math.round(toPercent - fromPercent));
            if (delta >= 100) {
                // we will finish animation in 100 times
                times = 100;
                if (!this.options.animateTitle && !this.options.animateSubtitle) {
                    step = 1;
                }
                else {
                    // show title or subtitle animation even if the arc is full, we also need to finish it in 100 times.
                    step = Math.round(delta / times);
                }
            }
            else {
                // we will finish in as many times as the number of percent.
                times = delta;
                step = 1;
            }
            // Get the interval of timer
            interval = Math.round(this.options.animationDuration / times);
            // Readjust all values if the interval of timer is extremely small.
            if (interval < MIN_INTERVAL) {
                interval = MIN_INTERVAL;
                times = this.options.animationDuration / interval;
                if (!this.options.animateTitle && !this.options.animateSubtitle && delta > 100) {
                    step = Math.round(100 / times);
                }
                else {
                    step = Math.round(delta / times);
                }
            }
            // step must be greater than 0.
            if (step < 1) {
                step = 1;
            }
            return { times: times, step: step, interval: interval };
        };
        this.animate = (previousPercent, currentPercent) => {
            if (this._timerSubscription && !this._timerSubscription.closed) {
                this._timerSubscription.unsubscribe();
            }
            let fromPercent = this.options.startFromZero ? 0 : previousPercent;
            let toPercent = currentPercent;
            let { step: step, interval: interval } = this.getAnimationParameters(fromPercent, toPercent);
            let count = fromPercent;
            if (fromPercent < toPercent) {
                this._timerSubscription = timer(0, interval).subscribe(() => {
                    count += step;
                    if (count <= toPercent) {
                        if (!this.options.animateTitle && !this.options.animateSubtitle && count >= 100) {
                            this.draw(toPercent);
                            this._timerSubscription.unsubscribe();
                        }
                        else {
                            this.draw(count);
                        }
                    }
                    else {
                        this.draw(toPercent);
                        this._timerSubscription.unsubscribe();
                    }
                });
            }
            else {
                this._timerSubscription = timer(0, interval).subscribe(() => {
                    count -= step;
                    if (count >= toPercent) {
                        if (!this.options.animateTitle && !this.options.animateSubtitle && toPercent >= 100) {
                            this.draw(toPercent);
                            this._timerSubscription.unsubscribe();
                        }
                        else {
                            this.draw(count);
                        }
                    }
                    else {
                        this.draw(toPercent);
                        this._timerSubscription.unsubscribe();
                    }
                });
            }
        };
        this.emitClickEvent = (event) => {
            if (this.options.renderOnClick) {
                this.animate(0, this.options.percent);
            }
            this.onClick.emit(event);
        };
        this.applyOptions = () => {
            // the options of <circle-progress> may change already
            for (let name of Object.keys(this.options)) {
                if (this.hasOwnProperty(name) && this[name] !== undefined) {
                    this.options[name] = this[name];
                }
                else if (this.templateOptions && this.templateOptions[name] !== undefined) {
                    this.options[name] = this.templateOptions[name];
                }
            }
            // make sure key options valid
            this.options.radius = Math.abs(+this.options.radius);
            this.options.space = +this.options.space;
            this.options.percent = +this.options.percent > 0 ? +this.options.percent : 0;
            this.options.maxPercent = Math.abs(+this.options.maxPercent);
            this.options.animationDuration = Math.abs(this.options.animationDuration);
            this.options.outerStrokeWidth = Math.abs(+this.options.outerStrokeWidth);
            this.options.innerStrokeWidth = Math.abs(+this.options.innerStrokeWidth);
            this.options.backgroundPadding = +this.options.backgroundPadding;
        };
        this.getRelativeY = (rowNum, rowCount) => {
            // why '-0.18em'? It's a magic number when property 'alignment-baseline' equals 'baseline'. :)
            let initialOffset = -0.18, offset = 1;
            return (initialOffset + offset * (rowNum - rowCount / 2)).toFixed(2) + 'em';
        };
        this.min = (a, b) => {
            return a < b ? a : b;
        };
        this.max = (a, b) => {
            return a > b ? a : b;
        };
        this.uuid = () => {
            // https://www.w3resource.com/javascript-exercises/javascript-math-exercise-23.php
            var dt = new Date().getTime();
            var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                var r = (dt + Math.random() * 16) % 16 | 0;
                dt = Math.floor(dt / 16);
                return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
            });
            return uuid;
        };
        this.findSvgElement = function () {
            if (this.svgElement === null) {
                let tags = this.elRef.nativeElement.getElementsByTagName('svg');
                if (tags.length > 0) {
                    this.svgElement = tags[0];
                }
            }
        };
        this.checkViewport = () => {
            this.findSvgElement();
            let previousValue = this.isInViewport;
            this.isInViewport = this.isElementInViewport(this.svgElement);
            if (previousValue !== this.isInViewport) {
                this.onViewportChanged.emit({ oldValue: previousValue, newValue: this.isInViewport });
            }
        };
        this.onScroll = (event) => {
            this.checkViewport();
        };
        this.loadEventsForLazyMode = () => {
            if (this.options.lazy) {
                this.document.addEventListener('scroll', this.onScroll, true);
                this.window.addEventListener('resize', this.onScroll, true);
                if (this._viewportChangedSubscriber === null) {
                    this._viewportChangedSubscriber = this.onViewportChanged.subscribe(({ oldValue, newValue }) => {
                        newValue ? this.render() : null;
                    });
                }
                // svgElement must be created in DOM before being checked.
                // Is there a better way to check the existence of svgElemnt?
                let _timer = timer(0, 50).subscribe(() => {
                    this.svgElement === null ? this.checkViewport() : _timer.unsubscribe();
                });
            }
        };
        this.unloadEventsForLazyMode = () => {
            // Remove event listeners
            this.document.removeEventListener('scroll', this.onScroll, true);
            this.window.removeEventListener('resize', this.onScroll, true);
            // Unsubscribe onViewportChanged
            if (this._viewportChangedSubscriber !== null) {
                this._viewportChangedSubscriber.unsubscribe();
                this._viewportChangedSubscriber = null;
            }
        };
        this.document = document;
        this.window = this.document.defaultView;
        Object.assign(this.options, defaultOptions);
        Object.assign(this.defaultOptions, defaultOptions);
    }
    isDrawing() {
        return (this._timerSubscription && !this._timerSubscription.closed);
    }
    isElementInViewport(el) {
        // Return false if el has not been created in page.
        if (el === null || el === undefined)
            return false;
        // Check if the element is out of view due to a container scrolling
        let rect = el.getBoundingClientRect(), parent = el.parentNode, parentRect;
        do {
            parentRect = parent.getBoundingClientRect();
            if (rect.top >= parentRect.bottom)
                return false;
            if (rect.bottom <= parentRect.top)
                return false;
            if (rect.left >= parentRect.right)
                return false;
            if (rect.right <= parentRect.left)
                return false;
            parent = parent.parentNode;
        } while (parent != this.document.body);
        // Check its within the document viewport
        if (rect.top >= (this.window.innerHeight || this.document.documentElement.clientHeight))
            return false;
        if (rect.bottom <= 0)
            return false;
        if (rect.left >= (this.window.innerWidth || this.document.documentElement.clientWidth))
            return false;
        if (rect.right <= 0)
            return false;
        return true;
    }
    ngOnInit() {
        this.loadEventsForLazyMode();
    }
    ngOnDestroy() {
        this.unloadEventsForLazyMode();
    }
    ngOnChanges(changes) {
        this.render();
        if ('lazy' in changes) {
            changes.lazy.currentValue ? this.loadEventsForLazyMode() : this.unloadEventsForLazyMode();
        }
    }
};
tslib_1.__decorate([
    Output(),
    tslib_1.__metadata("design:type", EventEmitter)
], CircleProgressComponent.prototype, "onClick", void 0);
tslib_1.__decorate([
    Input(),
    tslib_1.__metadata("design:type", String)
], CircleProgressComponent.prototype, "name", void 0);
tslib_1.__decorate([
    Input(),
    tslib_1.__metadata("design:type", String)
], CircleProgressComponent.prototype, "class", void 0);
tslib_1.__decorate([
    Input(),
    tslib_1.__metadata("design:type", Boolean)
], CircleProgressComponent.prototype, "backgroundGradient", void 0);
tslib_1.__decorate([
    Input(),
    tslib_1.__metadata("design:type", String)
], CircleProgressComponent.prototype, "backgroundColor", void 0);
tslib_1.__decorate([
    Input(),
    tslib_1.__metadata("design:type", String)
], CircleProgressComponent.prototype, "backgroundGradientStopColor", void 0);
tslib_1.__decorate([
    Input(),
    tslib_1.__metadata("design:type", Number)
], CircleProgressComponent.prototype, "backgroundOpacity", void 0);
tslib_1.__decorate([
    Input(),
    tslib_1.__metadata("design:type", String)
], CircleProgressComponent.prototype, "backgroundStroke", void 0);
tslib_1.__decorate([
    Input(),
    tslib_1.__metadata("design:type", Number)
], CircleProgressComponent.prototype, "backgroundStrokeWidth", void 0);
tslib_1.__decorate([
    Input(),
    tslib_1.__metadata("design:type", Number)
], CircleProgressComponent.prototype, "backgroundPadding", void 0);
tslib_1.__decorate([
    Input(),
    tslib_1.__metadata("design:type", Number)
], CircleProgressComponent.prototype, "radius", void 0);
tslib_1.__decorate([
    Input(),
    tslib_1.__metadata("design:type", Number)
], CircleProgressComponent.prototype, "space", void 0);
tslib_1.__decorate([
    Input(),
    tslib_1.__metadata("design:type", Number)
], CircleProgressComponent.prototype, "percent", void 0);
tslib_1.__decorate([
    Input(),
    tslib_1.__metadata("design:type", Number)
], CircleProgressComponent.prototype, "toFixed", void 0);
tslib_1.__decorate([
    Input(),
    tslib_1.__metadata("design:type", Number)
], CircleProgressComponent.prototype, "maxPercent", void 0);
tslib_1.__decorate([
    Input(),
    tslib_1.__metadata("design:type", Boolean)
], CircleProgressComponent.prototype, "renderOnClick", void 0);
tslib_1.__decorate([
    Input(),
    tslib_1.__metadata("design:type", String)
], CircleProgressComponent.prototype, "units", void 0);
tslib_1.__decorate([
    Input(),
    tslib_1.__metadata("design:type", String)
], CircleProgressComponent.prototype, "unitsFontSize", void 0);
tslib_1.__decorate([
    Input(),
    tslib_1.__metadata("design:type", String)
], CircleProgressComponent.prototype, "unitsFontWeight", void 0);
tslib_1.__decorate([
    Input(),
    tslib_1.__metadata("design:type", String)
], CircleProgressComponent.prototype, "unitsColor", void 0);
tslib_1.__decorate([
    Input(),
    tslib_1.__metadata("design:type", Boolean)
], CircleProgressComponent.prototype, "outerStrokeGradient", void 0);
tslib_1.__decorate([
    Input(),
    tslib_1.__metadata("design:type", Number)
], CircleProgressComponent.prototype, "outerStrokeWidth", void 0);
tslib_1.__decorate([
    Input(),
    tslib_1.__metadata("design:type", String)
], CircleProgressComponent.prototype, "outerStrokeColor", void 0);
tslib_1.__decorate([
    Input(),
    tslib_1.__metadata("design:type", String)
], CircleProgressComponent.prototype, "outerStrokeGradientStopColor", void 0);
tslib_1.__decorate([
    Input(),
    tslib_1.__metadata("design:type", String)
], CircleProgressComponent.prototype, "outerStrokeLinecap", void 0);
tslib_1.__decorate([
    Input(),
    tslib_1.__metadata("design:type", String)
], CircleProgressComponent.prototype, "innerStrokeColor", void 0);
tslib_1.__decorate([
    Input(),
    tslib_1.__metadata("design:type", Object)
], CircleProgressComponent.prototype, "innerStrokeWidth", void 0);
tslib_1.__decorate([
    Input(),
    tslib_1.__metadata("design:type", Function)
], CircleProgressComponent.prototype, "titleFormat", void 0);
tslib_1.__decorate([
    Input(),
    tslib_1.__metadata("design:type", Object)
], CircleProgressComponent.prototype, "title", void 0);
tslib_1.__decorate([
    Input(),
    tslib_1.__metadata("design:type", String)
], CircleProgressComponent.prototype, "titleColor", void 0);
tslib_1.__decorate([
    Input(),
    tslib_1.__metadata("design:type", String)
], CircleProgressComponent.prototype, "titleFontSize", void 0);
tslib_1.__decorate([
    Input(),
    tslib_1.__metadata("design:type", String)
], CircleProgressComponent.prototype, "titleFontWeight", void 0);
tslib_1.__decorate([
    Input(),
    tslib_1.__metadata("design:type", Function)
], CircleProgressComponent.prototype, "subtitleFormat", void 0);
tslib_1.__decorate([
    Input(),
    tslib_1.__metadata("design:type", Object)
], CircleProgressComponent.prototype, "subtitle", void 0);
tslib_1.__decorate([
    Input(),
    tslib_1.__metadata("design:type", String)
], CircleProgressComponent.prototype, "subtitleColor", void 0);
tslib_1.__decorate([
    Input(),
    tslib_1.__metadata("design:type", String)
], CircleProgressComponent.prototype, "subtitleFontSize", void 0);
tslib_1.__decorate([
    Input(),
    tslib_1.__metadata("design:type", String)
], CircleProgressComponent.prototype, "subtitleFontWeight", void 0);
tslib_1.__decorate([
    Input(),
    tslib_1.__metadata("design:type", String)
], CircleProgressComponent.prototype, "imageSrc", void 0);
tslib_1.__decorate([
    Input(),
    tslib_1.__metadata("design:type", Number)
], CircleProgressComponent.prototype, "imageHeight", void 0);
tslib_1.__decorate([
    Input(),
    tslib_1.__metadata("design:type", Number)
], CircleProgressComponent.prototype, "imageWidth", void 0);
tslib_1.__decorate([
    Input(),
    tslib_1.__metadata("design:type", Boolean)
], CircleProgressComponent.prototype, "animation", void 0);
tslib_1.__decorate([
    Input(),
    tslib_1.__metadata("design:type", Boolean)
], CircleProgressComponent.prototype, "animateTitle", void 0);
tslib_1.__decorate([
    Input(),
    tslib_1.__metadata("design:type", Boolean)
], CircleProgressComponent.prototype, "animateSubtitle", void 0);
tslib_1.__decorate([
    Input(),
    tslib_1.__metadata("design:type", Number)
], CircleProgressComponent.prototype, "animationDuration", void 0);
tslib_1.__decorate([
    Input(),
    tslib_1.__metadata("design:type", Boolean)
], CircleProgressComponent.prototype, "showTitle", void 0);
tslib_1.__decorate([
    Input(),
    tslib_1.__metadata("design:type", Boolean)
], CircleProgressComponent.prototype, "showSubtitle", void 0);
tslib_1.__decorate([
    Input(),
    tslib_1.__metadata("design:type", Boolean)
], CircleProgressComponent.prototype, "showUnits", void 0);
tslib_1.__decorate([
    Input(),
    tslib_1.__metadata("design:type", Boolean)
], CircleProgressComponent.prototype, "showImage", void 0);
tslib_1.__decorate([
    Input(),
    tslib_1.__metadata("design:type", Boolean)
], CircleProgressComponent.prototype, "showBackground", void 0);
tslib_1.__decorate([
    Input(),
    tslib_1.__metadata("design:type", Boolean)
], CircleProgressComponent.prototype, "showInnerStroke", void 0);
tslib_1.__decorate([
    Input(),
    tslib_1.__metadata("design:type", Boolean)
], CircleProgressComponent.prototype, "clockwise", void 0);
tslib_1.__decorate([
    Input(),
    tslib_1.__metadata("design:type", Boolean)
], CircleProgressComponent.prototype, "responsive", void 0);
tslib_1.__decorate([
    Input(),
    tslib_1.__metadata("design:type", Boolean)
], CircleProgressComponent.prototype, "startFromZero", void 0);
tslib_1.__decorate([
    Input(),
    tslib_1.__metadata("design:type", Boolean)
], CircleProgressComponent.prototype, "showZeroOuterStroke", void 0);
tslib_1.__decorate([
    Input(),
    tslib_1.__metadata("design:type", Boolean)
], CircleProgressComponent.prototype, "lazy", void 0);
tslib_1.__decorate([
    Input('options'),
    tslib_1.__metadata("design:type", CircleProgressOptions)
], CircleProgressComponent.prototype, "templateOptions", void 0);
CircleProgressComponent = tslib_1.__decorate([
    Component({
        selector: 'circle-progress',
        template: `
        <svg xmlns="http://www.w3.org/2000/svg" *ngIf="svg"
             [attr.viewBox]="svg.viewBox" preserveAspectRatio="xMidYMid meet"
             [attr.height]="svg.height" [attr.width]="svg.width" (click)="emitClickEvent($event)" [attr.class]="options.class">
            <defs>
                <linearGradient *ngIf="options.outerStrokeGradient" [attr.id]="svg.outerLinearGradient.id">
                    <stop offset="5%" [attr.stop-color]="svg.outerLinearGradient.colorStop1"  [attr.stop-opacity]="1"/>
                    <stop offset="95%" [attr.stop-color]="svg.outerLinearGradient.colorStop2" [attr.stop-opacity]="1"/>
                </linearGradient>
                <radialGradient *ngIf="options.backgroundGradient" [attr.id]="svg.radialGradient.id">
                    <stop offset="5%" [attr.stop-color]="svg.radialGradient.colorStop1" [attr.stop-opacity]="1"/>
                    <stop offset="95%" [attr.stop-color]="svg.radialGradient.colorStop2" [attr.stop-opacity]="1"/>
                </radialGradient>
            </defs>
            <ng-container *ngIf="options.showBackground">
                <circle *ngIf="!options.backgroundGradient"
                        [attr.cx]="svg.backgroundCircle.cx"
                        [attr.cy]="svg.backgroundCircle.cy"
                        [attr.r]="svg.backgroundCircle.r"
                        [attr.fill]="svg.backgroundCircle.fill"
                        [attr.fill-opacity]="svg.backgroundCircle.fillOpacity"
                        [attr.stroke]="svg.backgroundCircle.stroke"
                        [attr.stroke-width]="svg.backgroundCircle.strokeWidth"/>
                <circle *ngIf="options.backgroundGradient"
                        [attr.cx]="svg.backgroundCircle.cx"
                        [attr.cy]="svg.backgroundCircle.cy"
                        [attr.r]="svg.backgroundCircle.r"
                        attr.fill="url(#{{svg.radialGradient.id}})"
                        [attr.fill-opacity]="svg.backgroundCircle.fillOpacity"
                        [attr.stroke]="svg.backgroundCircle.stroke"
                        [attr.stroke-width]="svg.backgroundCircle.strokeWidth"/>
            </ng-container>            
            <circle *ngIf="options.showInnerStroke"
                    [attr.cx]="svg.circle.cx"
                    [attr.cy]="svg.circle.cy"
                    [attr.r]="svg.circle.r"
                    [attr.fill]="svg.circle.fill"
                    [attr.stroke]="svg.circle.stroke"
                    [attr.stroke-width]="svg.circle.strokeWidth"/>
            <ng-container *ngIf="+options.percent!==0 || options.showZeroOuterStroke">
                <path *ngIf="!options.outerStrokeGradient"
                        [attr.d]="svg.path.d"
                        [attr.stroke]="svg.path.stroke"
                        [attr.stroke-width]="svg.path.strokeWidth"
                        [attr.stroke-linecap]="svg.path.strokeLinecap"
                        [attr.fill]="svg.path.fill"/>
                <path *ngIf="options.outerStrokeGradient"
                        [attr.d]="svg.path.d"
                        attr.stroke="url(#{{svg.outerLinearGradient.id}})"
                        [attr.stroke-width]="svg.path.strokeWidth"
                        [attr.stroke-linecap]="svg.path.strokeLinecap"
                        [attr.fill]="svg.path.fill"/>
            </ng-container>
            <text *ngIf="!options.showImage && (options.showTitle || options.showUnits || options.showSubtitle)"
                  alignment-baseline="baseline"
                  [attr.x]="svg.circle.cx"
                  [attr.y]="svg.circle.cy"
                  [attr.text-anchor]="svg.title.textAnchor">
                <ng-container *ngIf="options.showTitle">
                    <tspan *ngFor="let tspan of svg.title.tspans"
                           [attr.x]="svg.title.x"
                           [attr.y]="svg.title.y"
                           [attr.dy]="tspan.dy"
                           [attr.font-size]="svg.title.fontSize"
                           [attr.font-weight]="svg.title.fontWeight"
                           [attr.fill]="svg.title.color">{{tspan.span}}</tspan>
                </ng-container>
                <tspan *ngIf="options.showUnits"
                       [attr.font-size]="svg.units.fontSize"
                       [attr.font-weight]="svg.units.fontWeight"
                       [attr.fill]="svg.units.color">{{svg.units.text}}</tspan>
                <ng-container *ngIf="options.showSubtitle">
                    <tspan *ngFor="let tspan of svg.subtitle.tspans"
                           [attr.x]="svg.subtitle.x"
                           [attr.y]="svg.subtitle.y"
                           [attr.dy]="tspan.dy"
                           [attr.font-size]="svg.subtitle.fontSize"
                           [attr.font-weight]="svg.subtitle.fontWeight"
                           [attr.fill]="svg.subtitle.color">{{tspan.span}}</tspan>
                </ng-container>
            </text>
            <image *ngIf="options.showImage" preserveAspectRatio="none" 
                [attr.height]="svg.image.height"
                [attr.width]="svg.image.width"
                [attr.xlink:href]="svg.image.src"
                [attr.x]="svg.image.x"
                [attr.y]="svg.image.y"
            />
        </svg>
    `
    }),
    tslib_1.__param(2, Inject(DOCUMENT)),
    tslib_1.__metadata("design:paramtypes", [CircleProgressOptions, ElementRef, Object])
], CircleProgressComponent);
export { CircleProgressComponent };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2lyY2xlLXByb2dyZXNzLmNvbXBvbmVudC5qcyIsInNvdXJjZVJvb3QiOiJuZzovL25nLWNpcmNsZS1wcm9ncmVzcy8iLCJzb3VyY2VzIjpbImNpcmNsZS1wcm9ncmVzcy5jb21wb25lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU8sRUFBQyxTQUFTLEVBQUUsWUFBWSxFQUFFLEtBQUssRUFBYSxNQUFNLEVBQUUsTUFBTSxFQUFxQixVQUFVLEVBQWdCLE1BQU0sZUFBZSxDQUFDO0FBQ3RJLE9BQU8sRUFBQyxRQUFRLEVBQUMsTUFBTSxpQkFBaUIsQ0FBQztBQUN6QyxPQUFPLEVBQWUsS0FBSyxFQUFDLE1BQU0sTUFBTSxDQUFDO0FBMER6QyxNQUFNLE9BQU8scUJBQXFCO0lBQWxDO1FBQ0ksVUFBSyxHQUFHLEVBQUUsQ0FBQztRQUNYLHVCQUFrQixHQUFHLEtBQUssQ0FBQztRQUMzQixvQkFBZSxHQUFHLGFBQWEsQ0FBQztRQUNoQyxnQ0FBMkIsR0FBRyxhQUFhLENBQUM7UUFDNUMsc0JBQWlCLEdBQUcsQ0FBQyxDQUFDO1FBQ3RCLHFCQUFnQixHQUFHLGFBQWEsQ0FBQztRQUNqQywwQkFBcUIsR0FBRyxDQUFDLENBQUM7UUFDMUIsc0JBQWlCLEdBQUcsQ0FBQyxDQUFDO1FBQ3RCLFlBQU8sR0FBRyxDQUFDLENBQUM7UUFDWixXQUFNLEdBQUcsRUFBRSxDQUFDO1FBQ1osVUFBSyxHQUFHLENBQUMsQ0FBQztRQUNWLFlBQU8sR0FBRyxDQUFDLENBQUM7UUFDWixlQUFVLEdBQUcsSUFBSSxDQUFDO1FBQ2xCLGtCQUFhLEdBQUcsSUFBSSxDQUFDO1FBQ3JCLFVBQUssR0FBRyxHQUFHLENBQUM7UUFDWixrQkFBYSxHQUFHLElBQUksQ0FBQztRQUNyQixvQkFBZSxHQUFHLFFBQVEsQ0FBQztRQUMzQixlQUFVLEdBQUcsU0FBUyxDQUFDO1FBQ3ZCLHdCQUFtQixHQUFHLEtBQUssQ0FBQztRQUM1QixxQkFBZ0IsR0FBRyxDQUFDLENBQUM7UUFD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Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7S0F5RlQ7S0FDSixDQUFDO0lBbWdCaUYsbUJBQUEsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFBOzZDQUFuRSxxQkFBcUIsRUFBaUIsVUFBVTtHQWxnQm5FLHVCQUF1QixDQXlnQm5DO1NBemdCWSx1QkFBdUIiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge0NvbXBvbmVudCwgRXZlbnRFbWl0dGVyLCBJbnB1dCwgT25DaGFuZ2VzLCBPdXRwdXQsIEluamVjdCwgT25Jbml0LCBPbkRlc3Ryb3ksIEVsZW1lbnRSZWYsIFNpbXBsZUNoYW5nZXN9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtET0NVTUVOVH0gZnJvbSAnQGFuZ3VsYXIvY29tbW9uJztcbmltcG9ydCB7U3Vic2NyaXB0aW9uLCB0aW1lcn0gZnJvbSAncnhqcyc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ2lyY2xlUHJvZ3Jlc3NPcHRpb25zSW50ZXJmYWNlIHtcbiAgICBjbGFzcz86IHN0cmluZztcbiAgICBiYWNrZ3JvdW5kR3JhZGllbnQ/OiBib29sZWFuO1xuICAgIGJhY2tncm91bmRDb2xvcj86IHN0cmluZztcbiAgICBiYWNrZ3JvdW5kR3JhZGllbnRTdG9wQ29sb3I/OiBzdHJpbmc7XG4gICAgYmFja2dyb3VuZE9wYWNpdHk/OiBudW1iZXI7XG4gICAgYmFja2dyb3VuZFN0cm9rZT86IHN0cmluZztcbiAgICBiYWNrZ3JvdW5kU3Ryb2tlV2lkdGg/OiBudW1iZXI7XG4gICAgYmFja2dyb3VuZFBhZGRpbmc/OiBudW1iZXI7XG4gICAgcGVyY2VudD86IG51bWJlcjtcbiAgICByYWRpdXM/OiBudW1iZXI7XG4gICAgc3BhY2U/OiBudW1iZXI7XG4gICAgdG9GaXhlZD86IG51bWJlcjtcbiAgICBtYXhQZXJjZW50PzogbnVtYmVyO1xuICAgIHJlbmRlck9uQ2xpY2s/OiBib29sZWFuO1xuICAgIHVuaXRzPzogc3RyaW5nO1xuICAgIHVuaXRzRm9udFNpemU/OiBzdHJpbmc7XG4gICAgdW5pdHNGb250V2VpZ2h0Pzogc3RyaW5nO1xuICAgIHVuaXRzQ29sb3I/OiBzdHJpbmc7XG4gICAgb3V0ZXJTdHJva2VHcmFkaWVudD86IGJvb2xlYW47XG4gICAgb3V0ZXJTdHJva2VXaWR0aD86IG51bWJlcjtcbiAgICBvdXRlclN0cm9rZUNvbG9yPzogc3RyaW5nO1xuICAgIG91dGVyU3Ryb2tlR3JhZGllbnRTdG9wQ29sb3I/OiBzdHJpbmc7XG4gICAgb3V0ZXJTdHJva2VMaW5lY2FwPzogc3RyaW5nO1xuICAgIGlubmVyU3Ryb2tlQ29sb3I/OiBzdHJpbmc7XG4gICAgaW5uZXJTdHJva2VXaWR0aD86IG51bWJlcjtcbiAgICB0aXRsZUZvcm1hdD86IEZ1bmN0aW9uO1xuICAgIHRpdGxlPzogc3RyaW5nIHwgQXJyYXk8U3RyaW5nPjtcbiAgICB0aXRsZUNvbG9yPzogc3RyaW5nO1xuICAgIHRpdGxlRm9udFNpemU/OiBzdHJpbmc7XG4gICAgdGl0bGVGb250V2VpZ2h0Pzogc3RyaW5nO1xuICAgIHN1YnRpdGxlRm9ybWF0PzogRnVuY3Rpb247XG4gICAgc3VidGl0bGU/OiBzdHJpbmcgfCBBcnJheTxTdHJpbmc+O1xuICAgIHN1YnRpdGxlQ29sb3I/OiBzdHJpbmc7XG4gICAgc3VidGl0bGVGb250U2l6ZT86IHN0cmluZztcbiAgICBzdWJ0aXRsZUZvbnRXZWlnaHQ/OiBzdHJpbmc7XG4gICAgaW1hZ2VTcmM/OiBzdHJpbmc7XG4gICAgaW1hZ2VIZWlnaHQ/OiBudW1iZXI7XG4gICAgaW1hZ2VXaWR0aD86IG51bWJlcjsgICAgXG4gICAgYW5pbWF0aW9uPzogYm9vbGVhbjtcbiAgICBhbmltYXRlVGl0bGU/OiBib29sZWFuO1xuICAgIGFuaW1hdGVTdWJ0aXRsZT86IGJvb2xlYW47XG4gICAgYW5pbWF0aW9uRHVyYXRpb24/OiBudW1iZXI7XG4gICAgc2hvd1RpdGxlPzogYm9vbGVhbjtcbiAgICBzaG93U3VidGl0bGU/OiBib29sZWFuO1xuICAgIHNob3dVbml0cz86IGJvb2xlYW47XG4gICAgc2hvd0ltYWdlPzogYm9vbGVhbjtcbiAgICBzaG93QmFja2dyb3VuZD86IGJvb2xlYW47XG4gICAgc2hvd0lubmVyU3Ryb2tlPzogYm9vbGVhbjtcbiAgICBjbG9ja3dpc2U/OiBib29sZWFuO1xuICAgIHJlc3BvbnNpdmU/OiBib29sZWFuO1xuICAgIHN0YXJ0RnJvbVplcm8/OiBib29sZWFuO1xuICAgIHNob3daZXJvT3V0ZXJTdHJva2U/OiBib29sZWFuO1xuICAgIGxhenk/OiBib29sZWFuO1xufVxuXG5leHBvcnQgY2xhc3MgQ2lyY2xlUHJvZ3Jlc3NPcHRpb25zIGltcGxlbWVudHMgQ2lyY2xlUHJvZ3Jlc3NPcHRpb25zSW50ZXJmYWNlIHtcbiAgICBjbGFzcyA9ICcnO1xuICAgIGJhY2tncm91bmRHcmFkaWVudCA9IGZhbHNlO1xuICAgIGJhY2tncm91bmRDb2xvciA9ICd0cmFuc3BhcmVudCc7XG4gICAgYmFja2dyb3VuZEdyYWRpZW50U3RvcENvbG9yID0gJ3RyYW5zcGFyZW50JztcbiAgICBiYWNrZ3JvdW5kT3BhY2l0eSA9IDE7XG4gICAgYmFja2dyb3VuZFN0cm9rZSA9ICd0cmFuc3BhcmVudCc7XG4gICAgYmFja2dyb3VuZFN0cm9rZVdpZHRoID0gMDtcbiAgICBiYWNrZ3JvdW5kUGFkZGluZyA9IDU7XG4gICAgcGVyY2VudCA9IDA7XG4gICAgcmFkaXVzID0gOTA7XG4gICAgc3BhY2UgPSA0O1xuICAgIHRvRml4ZWQgPSAwO1xuICAgIG1heFBlcmNlbnQgPSAxMDAwO1xuICAgIHJlbmRlck9uQ2xpY2sgPSB0cnVlO1xuICAgIHVuaXRzID0gJyUnO1xuICAgIHVuaXRzRm9udFNpemUgPSAnMTAnO1xuICAgIHVuaXRzRm9udFdlaWdodCA9ICdub3JtYWwnO1xuICAgIHVuaXRzQ29sb3IgPSAnIzQ0NDQ0NCc7XG4gICAgb3V0ZXJTdHJva2VHcmFkaWVudCA9IGZhbHNlO1xuICAgIG91dGVyU3Ryb2tlV2lkdGggPSA4O1xuICAgIG91dGVyU3Ryb2tlQ29sb3IgPSAnIzc4QzAwMCc7XG4gICAgb3V0ZXJTdHJva2VHcmFkaWVudFN0b3BDb2xvciA9ICd0cmFuc3BhcmVudCc7XG4gICAgb3V0ZXJTdHJva2VMaW5lY2FwID0gJ3JvdW5kJztcbiAgICBpbm5lclN0cm9rZUNvbG9yID0gJyNDN0U1OTYnO1xuICAgIGlubmVyU3Ryb2tlV2lkdGggPSA0O1xuICAgIHRpdGxlRm9ybWF0ID0gdW5kZWZpbmVkO1xuICAgIHRpdGxlOiBzdHJpbmcgfCBBcnJheTxTdHJpbmc+ID0gJ2F1dG8nO1xuICAgIHRpdGxlQ29sb3IgPSAnIzQ0NDQ0NCc7XG4gICAgdGl0bGVGb250U2l6ZSA9ICcyMCc7XG4gICAgdGl0bGVGb250V2VpZ2h0ID0gJ25vcm1hbCc7XG4gICAgc3VidGl0bGVGb3JtYXQgPSB1bmRlZmluZWQ7XG4gICAgc3VidGl0bGU6IHN0cmluZyB8IEFycmF5PFN0cmluZz4gPSAncHJvZ3Jlc3MnO1xuICAgIHN1YnRpdGxlQ29sb3IgPSAnI0E5QTlBOSc7XG4gICAgc3VidGl0bGVGb250U2l6ZSA9ICcxMCc7XG4gICAgc3VidGl0bGVGb250V2VpZ2h0ID0gJ25vcm1hbCc7XG4gICAgaW1hZ2VTcmMgPSB1bmRlZmluZWQ7XG4gICAgaW1hZ2VIZWlnaHQgPSB1bmRlZmluZWQ7XG4gICAgaW1hZ2VXaWR0aCA9IHVuZGVmaW5lZDtcbiAgICBhbmltYXRpb24gPSB0cnVlO1xuICAgIGFuaW1hdGVUaXRsZSA9IHRydWU7XG4gICAgYW5pbWF0ZVN1YnRpdGxlID0gZmFsc2U7XG4gICAgYW5pbWF0aW9uRHVyYXRpb24gPSA1MDA7XG4gICAgc2hvd1RpdGxlID0gdHJ1ZTtcbiAgICBzaG93U3VidGl0bGUgPSB0cnVlO1xuICAgIHNob3dVbml0cyA9IHRydWU7XG4gICAgc2hvd0ltYWdlID0gZmFsc2U7XG4gICAgc2hvd0JhY2tncm91bmQgPSB0cnVlO1xuICAgIHNob3dJbm5lclN0cm9rZSA9IHRydWU7XG4gICAgY2xvY2t3aXNlID0gdHJ1ZTtcbiAgICByZXNwb25zaXZlID0gZmFsc2U7XG4gICAgc3RhcnRGcm9tWmVybyA9IHRydWU7XG4gICAgc2hvd1plcm9PdXRlclN0cm9rZSA9IHRydWU7XG4gICAgbGF6eSA9IGZhbHNlO1xufVxuXG4vKiogQGR5bmFtaWMgUHJldmVudCBjb21waWxpbmcgZXJyb3Igd2hlbiB1c2luZyB0eXBlIGBEb2N1bWVudGAgaHR0cHM6Ly9naXRodWIuY29tL2FuZ3VsYXIvYW5ndWxhci9pc3N1ZXMvMjAzNTEgKi9cbkBDb21wb25lbnQoe1xuICAgIHNlbGVjdG9yOiAnY2lyY2xlLXByb2dyZXNzJyxcbiAgICB0ZW1wbGF0ZTogYFxuICAgICAgICA8c3ZnIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiAqbmdJZj1cInN2Z1wiXG4gICAgICAgICAgICAgW2F0dHIudmlld0JveF09XCJzdmcudmlld0JveFwiIHByZXNlcnZlQXNwZWN0UmF0aW89XCJ4TWlkWU1pZCBtZWV0XCJcbiAgICAgICAgICAgICBbYXR0ci5oZWlnaHRdPVwic3ZnLmhlaWdodFwiIFthdHRyLndpZHRoXT1cInN2Zy53aWR0aFwiIChjbGljayk9XCJlbWl0Q2xpY2tFdmVudCgkZXZlbnQpXCIgW2F0dHIuY2xhc3NdPVwib3B0aW9ucy5jbGFzc1wiPlxuICAgICAgICAgICAgPGRlZnM+XG4gICAgICAgICAgICAgICAgPGxpbmVhckdyYWRpZW50ICpuZ0lmPVwib3B0aW9ucy5vdXRlclN0cm9rZUdyYWRpZW50XCIgW2F0dHIuaWRdPVwic3ZnLm91dGVyTGluZWFyR3JhZGllbnQuaWRcIj5cbiAgICAgICAgICAgICAgICAgICAgPHN0b3Agb2Zmc2V0PVwiNSVcIiBbYXR0ci5zdG9wLWNvbG9yXT1cInN2Zy5vdXRlckxpbmVhckdyYWRpZW50LmNvbG9yU3RvcDFcIiAgW2F0dHIuc3RvcC1vcGFjaXR5XT1cIjFcIi8+XG4gICAgICAgICAgICAgICAgICAgIDxzdG9wIG9mZnNldD1cIjk1JVwiIFthdHRyLnN0b3AtY29sb3JdPVwic3ZnLm91dGVyTGluZWFyR3JhZGllbnQuY29sb3JTdG9wMlwiIFthdHRyLnN0b3Atb3BhY2l0eV09XCIxXCIvPlxuICAgICAgICAgICAgICAgIDwvbGluZWFyR3JhZGllbnQ+XG4gICAgICAgICAgICAgICAgPHJhZGlhbEdyYWRpZW50ICpuZ0lmPVwib3B0aW9ucy5iYWNrZ3JvdW5kR3JhZGllbnRcIiBbYXR0ci5pZF09XCJzdmcucmFkaWFsR3JhZGllbnQuaWRcIj5cbiAgICAgICAgICAgICAgICAgICAgPHN0b3Agb2Zmc2V0PVwiNSVcIiBbYXR0ci5zdG9wLWNvbG9yXT1cInN2Zy5yYWRpYWxHcmFkaWVudC5jb2xvclN0b3AxXCIgW2F0dHIuc3RvcC1vcGFjaXR5XT1cIjFcIi8+XG4gICAgICAgICAgICAgICAgICAgIDxzdG9wIG9mZnNldD1cIjk1JVwiIFthdHRyLnN0b3AtY29sb3JdPVwic3ZnLnJhZGlhbEdyYWRpZW50LmNvbG9yU3RvcDJcIiBbYXR0ci5zdG9wLW9wYWNpdHldPVwiMVwiLz5cbiAgICAgICAgICAgICAgICA8L3JhZGlhbEdyYWRpZW50PlxuICAgICAgICAgICAgPC9kZWZzPlxuICAgICAgICAgICAgPG5nLWNvbnRhaW5lciAqbmdJZj1cIm9wdGlvbnMuc2hvd0JhY2tncm91bmRcIj5cbiAgICAgICAgICAgICAgICA8Y2lyY2xlICpuZ0lmPVwiIW9wdGlvbnMuYmFja2dyb3VuZEdyYWRpZW50XCJcbiAgICAgICAgICAgICAgICAgICAgICAgIFthdHRyLmN4XT1cInN2Zy5iYWNrZ3JvdW5kQ2lyY2xlLmN4XCJcbiAgICAgICAgICAgICAgICAgICAgICAgIFthdHRyLmN5XT1cInN2Zy5iYWNrZ3JvdW5kQ2lyY2xlLmN5XCJcbiAgICAgICAgICAgICAgICAgICAgICAgIFthdHRyLnJdPVwic3ZnLmJhY2tncm91bmRDaXJjbGUuclwiXG4gICAgICAgICAgICAgICAgICAgICAgICBbYXR0ci5maWxsXT1cInN2Zy5iYWNrZ3JvdW5kQ2lyY2xlLmZpbGxcIlxuICAgICAgICAgICAgICAgICAgICAgICAgW2F0dHIuZmlsbC1vcGFjaXR5XT1cInN2Zy5iYWNrZ3JvdW5kQ2lyY2xlLmZpbGxPcGFjaXR5XCJcbiAgICAgICAgICAgICAgICAgICAgICAgIFthdHRyLnN0cm9rZV09XCJzdmcuYmFja2dyb3VuZENpcmNsZS5zdHJva2VcIlxuICAgICAgICAgICAgICAgICAgICAgICAgW2F0dHIuc3Ryb2tlLXdpZHRoXT1cInN2Zy5iYWNrZ3JvdW5kQ2lyY2xlLnN0cm9rZVdpZHRoXCIvPlxuICAgICAgICAgICAgICAgIDxjaXJjbGUgKm5nSWY9XCJvcHRpb25zLmJhY2tncm91bmRHcmFkaWVudFwiXG4gICAgICAgICAgICAgICAgICAgICAgICBbYXR0ci5jeF09XCJzdmcuYmFja2dyb3VuZENpcmNsZS5jeFwiXG4gICAgICAgICAgICAgICAgICAgICAgICBbYXR0ci5jeV09XCJzdmcuYmFja2dyb3VuZENpcmNsZS5jeVwiXG4gICAgICAgICAgICAgICAgICAgICAgICBbYXR0ci5yXT1cInN2Zy5iYWNrZ3JvdW5kQ2lyY2xlLnJcIlxuICAgICAgICAgICAgICAgICAgICAgICAgYXR0ci5maWxsPVwidXJsKCN7e3N2Zy5yYWRpYWxHcmFkaWVudC5pZH19KVwiXG4gICAgICAgICAgICAgICAgICAgICAgICBbYXR0ci5maWxsLW9wYWNpdHldPVwic3ZnLmJhY2tncm91bmRDaXJjbGUuZmlsbE9wYWNpdHlcIlxuICAgICAgICAgICAgICAgICAgICAgICAgW2F0dHIuc3Ryb2tlXT1cInN2Zy5iYWNrZ3JvdW5kQ2lyY2xlLnN0cm9rZVwiXG4gICAgICAgICAgICAgICAgICAgICAgICBbYXR0ci5zdHJva2Utd2lkdGhdPVwic3ZnLmJhY2tncm91bmRDaXJjbGUuc3Ryb2tlV2lkdGhcIi8+XG4gICAgICAgICAgICA8L25nLWNvbnRhaW5lcj4gICAgICAgICAgICBcbiAgICAgICAgICAgIDxjaXJjbGUgKm5nSWY9XCJvcHRpb25zLnNob3dJbm5lclN0cm9rZVwiXG4gICAgICAgICAgICAgICAgICAgIFthdHRyLmN4XT1cInN2Zy5jaXJjbGUuY3hcIlxuICAgICAgICAgICAgICAgICAgICBbYXR0ci5jeV09XCJzdmcuY2lyY2xlLmN5XCJcbiAgICAgICAgICAgICAgICAgICAgW2F0dHIucl09XCJzdmcuY2lyY2xlLnJcIlxuICAgICAgICAgICAgICAgICAgICBbYXR0ci5maWxsXT1cInN2Zy5jaXJjbGUuZmlsbFwiXG4gICAgICAgICAgICAgICAgICAgIFthdHRyLnN0cm9rZV09XCJzdmcuY2lyY2xlLnN0cm9rZVwiXG4gICAgICAgICAgICAgICAgICAgIFthdHRyLnN0cm9rZS13aWR0aF09XCJzdmcuY2lyY2xlLnN0cm9rZVdpZHRoXCIvPlxuICAgICAgICAgICAgPG5nLWNvbnRhaW5lciAqbmdJZj1cIitvcHRpb25zLnBlcmNlbnQhPT0wIHx8IG9wdGlvbnMuc2hvd1plcm9PdXRlclN0cm9rZVwiPlxuICAgICAgICAgICAgICAgIDxwYXRoICpuZ0lmPVwiIW9wdGlvbnMub3V0ZXJTdHJva2VHcmFkaWVudFwiXG4gICAgICAgICAgICAgICAgICAgICAgICBbYXR0ci5kXT1cInN2Zy5wYXRoLmRcIlxuICAgICAgICAgICAgICAgICAgICAgICAgW2F0dHIuc3Ryb2tlXT1cInN2Zy5wYXRoLnN0cm9rZVwiXG4gICAgICAgICAgICAgICAgICAgICAgICBbYXR0ci5zdHJva2Utd2lkdGhdPVwic3ZnLnBhdGguc3Ryb2tlV2lkdGhcIlxuICAgICAgICAgICAgICAgICAgICAgICAgW2F0dHIuc3Ryb2tlLWxpbmVjYXBdPVwic3ZnLnBhdGguc3Ryb2tlTGluZWNhcFwiXG4gICAgICAgICAgICAgICAgICAgICAgICBbYXR0ci5maWxsXT1cInN2Zy5wYXRoLmZpbGxcIi8+XG4gICAgICAgICAgICAgICAgPHBhdGggKm5nSWY9XCJvcHRpb25zLm91dGVyU3Ryb2tlR3JhZGllbnRcIlxuICAgICAgICAgICAgICAgICAgICAgICAgW2F0dHIuZF09XCJzdmcucGF0aC5kXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIGF0dHIuc3Ryb2tlPVwidXJsKCN7e3N2Zy5vdXRlckxpbmVhckdyYWRpZW50LmlkfX0pXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIFthdHRyLnN0cm9rZS13aWR0aF09XCJzdmcucGF0aC5zdHJva2VXaWR0aFwiXG4gICAgICAgICAgICAgICAgICAgICAgICBbYXR0ci5zdHJva2UtbGluZWNhcF09XCJzdmcucGF0aC5zdHJva2VMaW5lY2FwXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIFthdHRyLmZpbGxdPVwic3ZnLnBhdGguZmlsbFwiLz5cbiAgICAgICAgICAgIDwvbmctY29udGFpbmVyPlxuICAgICAgICAgICAgPHRleHQgKm5nSWY9XCIhb3B0aW9ucy5zaG93SW1hZ2UgJiYgKG9wdGlvbnMuc2hvd1RpdGxlIHx8IG9wdGlvbnMuc2hvd1VuaXRzIHx8IG9wdGlvbnMuc2hvd1N1YnRpdGxlKVwiXG4gICAgICAgICAgICAgICAgICBhbGlnbm1lbnQtYmFzZWxpbmU9XCJiYXNlbGluZVwiXG4gICAgICAgICAgICAgICAgICBbYXR0ci54XT1cInN2Zy5jaXJjbGUuY3hcIlxuICAgICAgICAgICAgICAgICAgW2F0dHIueV09XCJzdmcuY2lyY2xlLmN5XCJcbiAgICAgICAgICAgICAgICAgIFthdHRyLnRleHQtYW5jaG9yXT1cInN2Zy50aXRsZS50ZXh0QW5jaG9yXCI+XG4gICAgICAgICAgICAgICAgPG5nLWNvbnRhaW5lciAqbmdJZj1cIm9wdGlvbnMuc2hvd1RpdGxlXCI+XG4gICAgICAgICAgICAgICAgICAgIDx0c3BhbiAqbmdGb3I9XCJsZXQgdHNwYW4gb2Ygc3ZnLnRpdGxlLnRzcGFuc1wiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICBbYXR0ci54XT1cInN2Zy50aXRsZS54XCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIFthdHRyLnldPVwic3ZnLnRpdGxlLnlcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgW2F0dHIuZHldPVwidHNwYW4uZHlcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgW2F0dHIuZm9udC1zaXplXT1cInN2Zy50aXRsZS5mb250U2l6ZVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICBbYXR0ci5mb250LXdlaWdodF09XCJzdmcudGl0bGUuZm9udFdlaWdodFwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICBbYXR0ci5maWxsXT1cInN2Zy50aXRsZS5jb2xvclwiPnt7dHNwYW4uc3Bhbn19PC90c3Bhbj5cbiAgICAgICAgICAgICAgICA8L25nLWNvbnRhaW5lcj5cbiAgICAgICAgICAgICAgICA8dHNwYW4gKm5nSWY9XCJvcHRpb25zLnNob3dVbml0c1wiXG4gICAgICAgICAgICAgICAgICAgICAgIFthdHRyLmZvbnQtc2l6ZV09XCJzdmcudW5pdHMuZm9udFNpemVcIlxuICAgICAgICAgICAgICAgICAgICAgICBbYXR0ci5mb250LXdlaWdodF09XCJzdmcudW5pdHMuZm9udFdlaWdodFwiXG4gICAgICAgICAgICAgICAgICAgICAgIFthdHRyLmZpbGxdPVwic3ZnLnVuaXRzLmNvbG9yXCI+e3tzdmcudW5pdHMudGV4dH19PC90c3Bhbj5cbiAgICAgICAgICAgICAgICA8bmctY29udGFpbmVyICpuZ0lmPVwib3B0aW9ucy5zaG93U3VidGl0bGVcIj5cbiAgICAgICAgICAgICAgICAgICAgPHRzcGFuICpuZ0Zvcj1cImxldCB0c3BhbiBvZiBzdmcuc3VidGl0bGUudHNwYW5zXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIFthdHRyLnhdPVwic3ZnLnN1YnRpdGxlLnhcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgW2F0dHIueV09XCJzdmcuc3VidGl0bGUueVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICBbYXR0ci5keV09XCJ0c3Bhbi5keVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICBbYXR0ci5mb250LXNpemVdPVwic3ZnLnN1YnRpdGxlLmZvbnRTaXplXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIFthdHRyLmZvbnQtd2VpZ2h0XT1cInN2Zy5zdWJ0aXRsZS5mb250V2VpZ2h0XCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIFthdHRyLmZpbGxdPVwic3ZnLnN1YnRpdGxlLmNvbG9yXCI+e3t0c3Bhbi5zcGFufX08L3RzcGFuPlxuICAgICAgICAgICAgICAgIDwvbmctY29udGFpbmVyPlxuICAgICAgICAgICAgPC90ZXh0PlxuICAgICAgICAgICAgPGltYWdlICpuZ0lmPVwib3B0aW9ucy5zaG93SW1hZ2VcIiBwcmVzZXJ2ZUFzcGVjdFJhdGlvPVwibm9uZVwiIFxuICAgICAgICAgICAgICAgIFthdHRyLmhlaWdodF09XCJzdmcuaW1hZ2UuaGVpZ2h0XCJcbiAgICAgICAgICAgICAgICBbYXR0ci53aWR0aF09XCJzdmcuaW1hZ2Uud2lkdGhcIlxuICAgICAgICAgICAgICAgIFthdHRyLnhsaW5rOmhyZWZdPVwic3ZnLmltYWdlLnNyY1wiXG4gICAgICAgICAgICAgICAgW2F0dHIueF09XCJzdmcuaW1hZ2UueFwiXG4gICAgICAgICAgICAgICAgW2F0dHIueV09XCJzdmcuaW1hZ2UueVwiXG4gICAgICAgICAgICAvPlxuICAgICAgICA8L3N2Zz5cbiAgICBgXG59KVxuZXhwb3J0IGNsYXNzIENpcmNsZVByb2dyZXNzQ29tcG9uZW50IGltcGxlbWVudHMgT25DaGFuZ2VzLCBPbkluaXQsIE9uRGVzdHJveSB7XG5cbiAgICBAT3V0cHV0KCkgb25DbGljazogRXZlbnRFbWl0dGVyPGFueT4gPSBuZXcgRXZlbnRFbWl0dGVyKCk7XG5cbiAgICBASW5wdXQoKSBuYW1lOiBzdHJpbmc7XG4gICAgQElucHV0KCkgY2xhc3M6IHN0cmluZztcbiAgICBASW5wdXQoKSBiYWNrZ3JvdW5kR3JhZGllbnQ6IGJvb2xlYW47XG4gICAgQElucHV0KCkgYmFja2dyb3VuZENvbG9yOiBzdHJpbmc7XG4gICAgQElucHV0KCkgYmFja2dyb3VuZEdyYWRpZW50U3RvcENvbG9yOiBTdHJpbmc7XG4gICAgQElucHV0KCkgYmFja2dyb3VuZE9wYWNpdHk6IG51bWJlcjtcbiAgICBASW5wdXQoKSBiYWNrZ3JvdW5kU3Ryb2tlOiBzdHJpbmc7XG4gICAgQElucHV0KCkgYmFja2dyb3VuZFN0cm9rZVdpZHRoOiBudW1iZXI7XG4gICAgQElucHV0KCkgYmFja2dyb3VuZFBhZGRpbmc6IG51bWJlcjtcblxuICAgIEBJbnB1dCgpIHJhZGl1czogbnVtYmVyO1xuICAgIEBJbnB1dCgpIHNwYWNlOiBudW1iZXI7XG4gICAgQElucHV0KCkgcGVyY2VudDogbnVtYmVyO1xuICAgIEBJbnB1dCgpIHRvRml4ZWQ6IG51bWJlcjtcbiAgICBASW5wdXQoKSBtYXhQZXJjZW50OiBudW1iZXI7XG4gICAgQElucHV0KCkgcmVuZGVyT25DbGljazogYm9vbGVhbjtcblxuICAgIEBJbnB1dCgpIHVuaXRzOiBzdHJpbmc7XG4gICAgQElucHV0KCkgdW5pdHNGb250U2l6ZTogc3RyaW5nO1xuICAgIEBJbnB1dCgpIHVuaXRzRm9udFdlaWdodDogc3RyaW5nO1xuICAgIEBJbnB1dCgpIHVuaXRzQ29sb3I6IHN0cmluZztcblxuICAgIEBJbnB1dCgpIG91dGVyU3Ryb2tlR3JhZGllbnQ6IGJvb2xlYW47XG4gICAgQElucHV0KCkgb3V0ZXJTdHJva2VXaWR0aDogbnVtYmVyO1xuICAgIEBJbnB1dCgpIG91dGVyU3Ryb2tlQ29sb3I6IHN0cmluZztcbiAgICBASW5wdXQoKSBvdXRlclN0cm9rZUdyYWRpZW50U3RvcENvbG9yOiBTdHJpbmc7XG4gICAgQElucHV0KCkgb3V0ZXJTdHJva2VMaW5lY2FwOiBzdHJpbmc7XG5cbiAgICBASW5wdXQoKSBpbm5lclN0cm9rZUNvbG9yOiBzdHJpbmc7XG4gICAgQElucHV0KCkgaW5uZXJTdHJva2VXaWR0aDogc3RyaW5nIHwgbnVtYmVyO1xuXG4gICAgQElucHV0KCkgdGl0bGVGb3JtYXQ6IEZ1bmN0aW9uO1xuICAgIEBJbnB1dCgpIHRpdGxlOiBzdHJpbmcgfCBBcnJheTxTdHJpbmc+O1xuICAgIEBJbnB1dCgpIHRpdGxlQ29sb3I6IHN0cmluZztcbiAgICBASW5wdXQoKSB0aXRsZUZvbnRTaXplOiBzdHJpbmc7XG4gICAgQElucHV0KCkgdGl0bGVGb250V2VpZ2h0OiBzdHJpbmc7XG5cbiAgICBASW5wdXQoKSBzdWJ0aXRsZUZvcm1hdDogRnVuY3Rpb247XG4gICAgQElucHV0KCkgc3VidGl0bGU6IHN0cmluZyB8IHN0cmluZ1tdO1xuICAgIEBJbnB1dCgpIHN1YnRpdGxlQ29sb3I6IHN0cmluZztcbiAgICBASW5wdXQoKSBzdWJ0aXRsZUZvbnRTaXplOiBzdHJpbmc7XG4gICAgQElucHV0KCkgc3VidGl0bGVGb250V2VpZ2h0OiBzdHJpbmc7XG5cbiAgICBASW5wdXQoKSBpbWFnZVNyYzogc3RyaW5nO1xuICAgIEBJbnB1dCgpIGltYWdlSGVpZ2h0OiBudW1iZXI7XG4gICAgQElucHV0KCkgaW1hZ2VXaWR0aDogbnVtYmVyO1xuXG4gICAgQElucHV0KCkgYW5pbWF0aW9uOiBib29sZWFuO1xuICAgIEBJbnB1dCgpIGFuaW1hdGVUaXRsZTogYm9vbGVhbjtcbiAgICBASW5wdXQoKSBhbmltYXRlU3VidGl0bGU6IGJvb2xlYW47XG4gICAgQElucHV0KCkgYW5pbWF0aW9uRHVyYXRpb246IG51bWJlcjtcblxuICAgIEBJbnB1dCgpIHNob3dUaXRsZTogYm9vbGVhbjtcbiAgICBASW5wdXQoKSBzaG93U3VidGl0bGU6IGJvb2xlYW47XG4gICAgQElucHV0KCkgc2hvd1VuaXRzOiBib29sZWFuO1xuICAgIEBJbnB1dCgpIHNob3dJbWFnZTogYm9vbGVhbjtcbiAgICBASW5wdXQoKSBzaG93QmFja2dyb3VuZDogYm9vbGVhbjtcbiAgICBASW5wdXQoKSBzaG93SW5uZXJTdHJva2U6IGJvb2xlYW47XG4gICAgQElucHV0KCkgY2xvY2t3aXNlOiBib29sZWFuO1xuICAgIEBJbnB1dCgpIHJlc3BvbnNpdmU6IGJvb2xlYW47XG4gICAgQElucHV0KCkgc3RhcnRGcm9tWmVybzogYm9vbGVhbjtcbiAgICBASW5wdXQoKSBzaG93WmVyb091dGVyU3Ryb2tlOiBib29sZWFuO1xuICAgIFxuICAgIEBJbnB1dCgpIGxhenk6IGJvb2xlYW47XG5cbiAgICBASW5wdXQoJ29wdGlvbnMnKSB0ZW1wbGF0ZU9wdGlvbnM6IENpcmNsZVByb2dyZXNzT3B0aW9ucztcblxuICAgIC8vIDxzdmc+IG9mIGNvbXBvbmVudFxuICAgIHN2Z0VsZW1lbnQ6IEhUTUxFbGVtZW50ID0gbnVsbDtcbiAgICAvLyB3aGV0aGVyIDxzdmc+IGlzIGluIHZpZXdwb3J0XG4gICAgaXNJblZpZXdwb3J0OiBCb29sZWFuID0gZmFsc2U7XG4gICAgLy8gZXZlbnQgZm9yIG5vdGlmeWluZyB2aWV3cG9ydCBjaGFuZ2UgY2F1c2VkIGJ5IHNjcm9sbGluZyBvciByZXNpemluZ1xuICAgIG9uVmlld3BvcnRDaGFuZ2VkOiBFdmVudEVtaXR0ZXI8e29sZFZhbHVlOiBCb29sZWFuLCBuZXdWYWx1ZTogQm9vbGVhbn0+ID0gbmV3IEV2ZW50RW1pdHRlcjtcbiAgICB3aW5kb3c6IFdpbmRvdztcbiAgICBfdmlld3BvcnRDaGFuZ2VkU3Vic2NyaWJlcjogU3Vic2NyaXB0aW9uID0gbnVsbDtcblxuICAgIHN2ZzogYW55O1xuXG4gICAgb3B0aW9uczogQ2lyY2xlUHJvZ3Jlc3NPcHRpb25zID0gbmV3IENpcmNsZVByb2dyZXNzT3B0aW9ucygpO1xuICAgIGRlZmF1bHRPcHRpb25zOiBDaXJjbGVQcm9ncmVzc09wdGlvbnMgPSBuZXcgQ2lyY2xlUHJvZ3Jlc3NPcHRpb25zKCk7XG4gICAgX2xhc3RQZXJjZW50OiBudW1iZXIgPSAwO1xuICAgIF9ncmFkaWVudFVVSUQ6IHN0cmluZyA9IG51bGw7XG4gICAgcmVuZGVyID0gKCkgPT4ge1xuXG4gICAgICAgIHRoaXMuYXBwbHlPcHRpb25zKCk7XG5cbiAgICAgICAgaWYodGhpcy5vcHRpb25zLmxhenkpe1xuICAgICAgICAgICAgLy8gRHJhdyBzdmcgaWYgaXQgZG9lc24ndCBleGlzdFxuICAgICAgICAgICAgdGhpcy5zdmdFbGVtZW50ID09PSBudWxsICYmIHRoaXMuZHJhdyh0aGlzLl9sYXN0UGVyY2VudCk7XG4gICAgICAgICAgICAvLyBEcmF3IGl0IG9ubHkgd2hlbiBpdCdzIGluIHRoZSB2aWV3cG9ydFxuICAgICAgICAgICAgaWYodGhpcy5pc0luVmlld3BvcnQpe1xuICAgICAgICAgICAgICAgIC8vIERyYXcgaXQgYXQgdGhlIGxhdGVzdCBwb3NpdGlvbiB3aGVuIEkgYW0gaW4uXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5hbmltYXRpb24gJiYgdGhpcy5vcHRpb25zLmFuaW1hdGlvbkR1cmF0aW9uID4gMCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmFuaW1hdGUodGhpcy5fbGFzdFBlcmNlbnQsIHRoaXMub3B0aW9ucy5wZXJjZW50KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmRyYXcodGhpcy5vcHRpb25zLnBlcmNlbnQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLl9sYXN0UGVyY2VudCA9IHRoaXMub3B0aW9ucy5wZXJjZW50O1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5hbmltYXRpb24gJiYgdGhpcy5vcHRpb25zLmFuaW1hdGlvbkR1cmF0aW9uID4gMCkge1xuICAgICAgICAgICAgICAgIHRoaXMuYW5pbWF0ZSh0aGlzLl9sYXN0UGVyY2VudCwgdGhpcy5vcHRpb25zLnBlcmNlbnQpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLmRyYXcodGhpcy5vcHRpb25zLnBlcmNlbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5fbGFzdFBlcmNlbnQgPSB0aGlzLm9wdGlvbnMucGVyY2VudDtcbiAgICAgICAgfVxuICAgIH07XG4gICAgcG9sYXJUb0NhcnRlc2lhbiA9IChjZW50ZXJYOiBudW1iZXIsIGNlbnRlclk6IG51bWJlciwgcmFkaXVzOiBudW1iZXIsIGFuZ2xlSW5EZWdyZWVzOiBudW1iZXIpID0+IHtcbiAgICAgICAgbGV0IGFuZ2xlSW5SYWRpdXMgPSBhbmdsZUluRGVncmVlcyAqIE1hdGguUEkgLyAxODA7XG4gICAgICAgIGxldCB4ID0gY2VudGVyWCArIE1hdGguc2luKGFuZ2xlSW5SYWRpdXMpICogcmFkaXVzO1xuICAgICAgICBsZXQgeSA9IGNlbnRlclkgLSBNYXRoLmNvcyhhbmdsZUluUmFkaXVzKSAqIHJhZGl1cztcbiAgICAgICAgcmV0dXJuIHt4OiB4LCB5OiB5fTtcbiAgICB9O1xuICAgIGRyYXcgPSAocGVyY2VudDogbnVtYmVyKSA9PiB7XG4gICAgICAgIC8vIG1ha2UgcGVyY2VudCByZWFzb25hYmxlXG4gICAgICAgIHBlcmNlbnQgPSAocGVyY2VudCA9PT0gdW5kZWZpbmVkKSA/IHRoaXMub3B0aW9ucy5wZXJjZW50IDogTWF0aC5hYnMocGVyY2VudCk7XG4gICAgICAgIC8vIGNpcmNsZSBwZXJjZW50IHNob3VsZG4ndCBiZSBncmVhdGVyIHRoYW4gMTAwJS5cbiAgICAgICAgbGV0IGNpcmNsZVBlcmNlbnQgPSAocGVyY2VudCA+IDEwMCkgPyAxMDAgOiBwZXJjZW50O1xuICAgICAgICAvLyBkZXRlcm1pbmUgYm94IHNpemVcbiAgICAgICAgbGV0IGJveFNpemUgPSB0aGlzLm9wdGlvbnMucmFkaXVzICogMiArIHRoaXMub3B0aW9ucy5vdXRlclN0cm9rZVdpZHRoICogMjtcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5zaG93QmFja2dyb3VuZCkge1xuICAgICAgICAgICAgYm94U2l6ZSArPSAodGhpcy5vcHRpb25zLmJhY2tncm91bmRTdHJva2VXaWR0aCAqIDIgKyB0aGlzLm1heCgwLCB0aGlzLm9wdGlvbnMuYmFja2dyb3VuZFBhZGRpbmcgKiAyKSk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gdGhlIGNlbnRyZSBvZiB0aGUgY2lyY2xlXG4gICAgICAgIGxldCBjZW50cmUgPSB7eDogYm94U2l6ZSAvIDIsIHk6IGJveFNpemUgLyAyfTtcbiAgICAgICAgLy8gdGhlIHN0YXJ0IHBvaW50IG9mIHRoZSBhcmNcbiAgICAgICAgbGV0IHN0YXJ0UG9pbnQgPSB7eDogY2VudHJlLngsIHk6IGNlbnRyZS55IC0gdGhpcy5vcHRpb25zLnJhZGl1c307XG4gICAgICAgIC8vIGdldCB0aGUgZW5kIHBvaW50IG9mIHRoZSBhcmNcbiAgICAgICAgbGV0IGVuZFBvaW50ID0gdGhpcy5wb2xhclRvQ2FydGVzaWFuKGNlbnRyZS54LCBjZW50cmUueSwgdGhpcy5vcHRpb25zLnJhZGl1cywgMzYwICogKHRoaXMub3B0aW9ucy5jbG9ja3dpc2UgP1xuICAgICAgICAgICAgY2lyY2xlUGVyY2VudCA6XG4gICAgICAgICAgICAoMTAwIC0gY2lyY2xlUGVyY2VudCkpIC8gMTAwKTsgIC8vICMjIyMjIyMjIyMjIyMjIyMjIyMjXG4gICAgICAgIC8vIFdlJ2xsIGdldCBhbiBlbmQgcG9pbnQgd2l0aCB0aGUgc2FtZSBbeCwgeV0gYXMgdGhlIHN0YXJ0IHBvaW50IHdoZW4gcGVyY2VudCBpcyAxMDAlLCBzbyBtb3ZlIHggYSBsaXR0bGUgYml0LlxuICAgICAgICBpZiAoY2lyY2xlUGVyY2VudCA9PT0gMTAwKSB7XG4gICAgICAgICAgICBlbmRQb2ludC54ID0gZW5kUG9pbnQueCArICh0aGlzLm9wdGlvbnMuY2xvY2t3aXNlID8gLTAuMDEgOiArMC4wMSk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gbGFyZ2VBcmNGbGFnIGFuZCBzd2VlcEZsYWdcbiAgICAgICAgbGV0IGxhcmdlQXJjRmxhZzogYW55LCBzd2VlcEZsYWc6IGFueTtcbiAgICAgICAgaWYgKGNpcmNsZVBlcmNlbnQgPiA1MCkge1xuICAgICAgICAgICAgW2xhcmdlQXJjRmxhZywgc3dlZXBGbGFnXSA9IHRoaXMub3B0aW9ucy5jbG9ja3dpc2UgPyBbMSwgMV0gOiBbMSwgMF07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBbbGFyZ2VBcmNGbGFnLCBzd2VlcEZsYWddID0gdGhpcy5vcHRpb25zLmNsb2Nrd2lzZSA/IFswLCAxXSA6IFswLCAwXTtcbiAgICAgICAgfVxuICAgICAgICAvLyBwZXJjZW50IG1heSBub3QgZXF1YWwgdGhlIGFjdHVhbCBwZXJjZW50XG4gICAgICAgIGxldCB0aXRsZVBlcmNlbnQgPSB0aGlzLm9wdGlvbnMuYW5pbWF0ZVRpdGxlID8gcGVyY2VudCA6IHRoaXMub3B0aW9ucy5wZXJjZW50O1xuICAgICAgICBsZXQgdGl0bGVUZXh0UGVyY2VudCA9IHRpdGxlUGVyY2VudCA+IHRoaXMub3B0aW9ucy5tYXhQZXJjZW50ID9cbiAgICAgICAgICAgIGAke3RoaXMub3B0aW9ucy5tYXhQZXJjZW50LnRvRml4ZWQodGhpcy5vcHRpb25zLnRvRml4ZWQpfStgIDogdGl0bGVQZXJjZW50LnRvRml4ZWQodGhpcy5vcHRpb25zLnRvRml4ZWQpO1xuICAgICAgICBsZXQgc3VidGl0bGVQZXJjZW50ID0gdGhpcy5vcHRpb25zLmFuaW1hdGVTdWJ0aXRsZSA/IHBlcmNlbnQgOiB0aGlzLm9wdGlvbnMucGVyY2VudDtcbiAgICAgICAgLy8gZ2V0IHRpdGxlIG9iamVjdFxuICAgICAgICBsZXQgdGl0bGUgPSB7XG4gICAgICAgICAgICB4OiBjZW50cmUueCxcbiAgICAgICAgICAgIHk6IGNlbnRyZS55LFxuICAgICAgICAgICAgdGV4dEFuY2hvcjogJ21pZGRsZScsXG4gICAgICAgICAgICBjb2xvcjogdGhpcy5vcHRpb25zLnRpdGxlQ29sb3IsXG4gICAgICAgICAgICBmb250U2l6ZTogdGhpcy5vcHRpb25zLnRpdGxlRm9udFNpemUsXG4gICAgICAgICAgICBmb250V2VpZ2h0OiB0aGlzLm9wdGlvbnMudGl0bGVGb250V2VpZ2h0LFxuICAgICAgICAgICAgdGV4dHM6IFtdLFxuICAgICAgICAgICAgdHNwYW5zOiBbXVxuICAgICAgICB9O1xuICAgICAgICAvLyBmcm9tIHYwLjkuOSwgYm90aCB0aXRsZSBhbmQgdGl0bGVGb3JtYXQoLi4uKSBtYXkgYmUgYW4gYXJyYXkgb2Ygc3RyaW5nLlxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLnRpdGxlRm9ybWF0ICE9PSB1bmRlZmluZWQgJiYgdGhpcy5vcHRpb25zLnRpdGxlRm9ybWF0LmNvbnN0cnVjdG9yLm5hbWUgPT09ICdGdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGxldCBmb3JtYXR0ZWQgPSB0aGlzLm9wdGlvbnMudGl0bGVGb3JtYXQodGl0bGVQZXJjZW50KTtcbiAgICAgICAgICAgIGlmIChmb3JtYXR0ZWQgaW5zdGFuY2VvZiBBcnJheSkge1xuICAgICAgICAgICAgICAgIHRpdGxlLnRleHRzID0gWy4uLmZvcm1hdHRlZF07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRpdGxlLnRleHRzLnB1c2goZm9ybWF0dGVkLnRvU3RyaW5nKCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy50aXRsZSA9PT0gJ2F1dG8nKSB7XG4gICAgICAgICAgICAgICAgdGl0bGUudGV4dHMucHVzaCh0aXRsZVRleHRQZXJjZW50KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy50aXRsZSBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgICAgICAgICAgICAgICAgIHRpdGxlLnRleHRzID0gWy4uLnRoaXMub3B0aW9ucy50aXRsZV1cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aXRsZS50ZXh0cy5wdXNoKHRoaXMub3B0aW9ucy50aXRsZS50b1N0cmluZygpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8gZ2V0IHN1YnRpdGxlIG9iamVjdFxuICAgICAgICBsZXQgc3VidGl0bGUgPSB7XG4gICAgICAgICAgICB4OiBjZW50cmUueCxcbiAgICAgICAgICAgIHk6IGNlbnRyZS55LFxuICAgICAgICAgICAgdGV4dEFuY2hvcjogJ21pZGRsZScsXG4gICAgICAgICAgICBjb2xvcjogdGhpcy5vcHRpb25zLnN1YnRpdGxlQ29sb3IsXG4gICAgICAgICAgICBmb250U2l6ZTogdGhpcy5vcHRpb25zLnN1YnRpdGxlRm9udFNpemUsXG4gICAgICAgICAgICBmb250V2VpZ2h0OiB0aGlzLm9wdGlvbnMuc3VidGl0bGVGb250V2VpZ2h0LFxuICAgICAgICAgICAgdGV4dHM6IFtdLFxuICAgICAgICAgICAgdHNwYW5zOiBbXVxuICAgICAgICB9XG4gICAgICAgIC8vIGZyb20gdjAuOS45LCBib3RoIHN1YnRpdGxlIGFuZCBzdWJ0aXRsZUZvcm1hdCguLi4pIG1heSBiZSBhbiBhcnJheSBvZiBzdHJpbmcuXG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMuc3VidGl0bGVGb3JtYXQgIT09IHVuZGVmaW5lZCAmJiB0aGlzLm9wdGlvbnMuc3VidGl0bGVGb3JtYXQuY29uc3RydWN0b3IubmFtZSA9PT0gJ0Z1bmN0aW9uJykge1xuICAgICAgICAgICAgbGV0IGZvcm1hdHRlZCA9IHRoaXMub3B0aW9ucy5zdWJ0aXRsZUZvcm1hdChzdWJ0aXRsZVBlcmNlbnQpO1xuICAgICAgICAgICAgaWYgKGZvcm1hdHRlZCBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgICAgICAgICAgICAgc3VidGl0bGUudGV4dHMgPSBbLi4uZm9ybWF0dGVkXTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgc3VidGl0bGUudGV4dHMucHVzaChmb3JtYXR0ZWQudG9TdHJpbmcoKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLnN1YnRpdGxlIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICAgICAgICAgICAgICBzdWJ0aXRsZS50ZXh0cyA9IFsuLi50aGlzLm9wdGlvbnMuc3VidGl0bGVdXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHN1YnRpdGxlLnRleHRzLnB1c2godGhpcy5vcHRpb25zLnN1YnRpdGxlLnRvU3RyaW5nKCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIGdldCB1bml0cyBvYmplY3RcbiAgICAgICAgbGV0IHVuaXRzID0ge1xuICAgICAgICAgICAgdGV4dDogYCR7dGhpcy5vcHRpb25zLnVuaXRzfWAsXG4gICAgICAgICAgICBmb250U2l6ZTogdGhpcy5vcHRpb25zLnVuaXRzRm9udFNpemUsXG4gICAgICAgICAgICBmb250V2VpZ2h0OiB0aGlzLm9wdGlvbnMudW5pdHNGb250V2VpZ2h0LFxuICAgICAgICAgICAgY29sb3I6IHRoaXMub3B0aW9ucy51bml0c0NvbG9yXG4gICAgICAgIH07XG4gICAgICAgIC8vIGdldCB0b3RhbCBjb3VudCBvZiB0ZXh0IGxpbmVzIHRvIGJlIHNob3duXG4gICAgICAgIGxldCByb3dDb3VudCA9IDAsIHJvd051bSA9IDE7XG4gICAgICAgIHRoaXMub3B0aW9ucy5zaG93VGl0bGUgJiYgKHJvd0NvdW50ICs9IHRpdGxlLnRleHRzLmxlbmd0aCk7XG4gICAgICAgIHRoaXMub3B0aW9ucy5zaG93U3VidGl0bGUgJiYgKHJvd0NvdW50ICs9IHN1YnRpdGxlLnRleHRzLmxlbmd0aCk7XG4gICAgICAgIC8vIGNhbGMgZHkgZm9yIGVhY2ggdHNwYW4gZm9yIHRpdGxlXG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMuc2hvd1RpdGxlKSB7XG4gICAgICAgICAgICBmb3IgKGxldCBzcGFuIG9mIHRpdGxlLnRleHRzKSB7XG4gICAgICAgICAgICAgICAgdGl0bGUudHNwYW5zLnB1c2goe3NwYW46IHNwYW4sIGR5OiB0aGlzLmdldFJlbGF0aXZlWShyb3dOdW0sIHJvd0NvdW50KX0pO1xuICAgICAgICAgICAgICAgIHJvd051bSsrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIGNhbGMgZHkgZm9yIGVhY2ggdHNwYW4gZm9yIHN1YnRpdGxlXG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMuc2hvd1N1YnRpdGxlKSB7XG4gICAgICAgICAgICBmb3IgKGxldCBzcGFuIG9mIHN1YnRpdGxlLnRleHRzKSB7XG4gICAgICAgICAgICAgICAgc3VidGl0bGUudHNwYW5zLnB1c2goe3NwYW46IHNwYW4sIGR5OiB0aGlzLmdldFJlbGF0aXZlWShyb3dOdW0sIHJvd0NvdW50KX0pXG4gICAgICAgICAgICAgICAgcm93TnVtKys7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8gY3JlYXRlIElEIGZvciBncmFkaWVudCBlbGVtZW50XG4gICAgICAgIGlmIChudWxsID09PSB0aGlzLl9ncmFkaWVudFVVSUQpe1xuICAgICAgICAgICAgdGhpcy5fZ3JhZGllbnRVVUlEID0gdGhpcy51dWlkKCk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gQnJpbmcgaXQgYWxsIHRvZ2V0aGVyXG4gICAgICAgIHRoaXMuc3ZnID0ge1xuICAgICAgICAgICAgdmlld0JveDogYDAgMCAke2JveFNpemV9ICR7Ym94U2l6ZX1gLFxuICAgICAgICAgICAgLy8gU2V0IGJvdGggd2lkdGggYW5kIGhlaWdodCB0byAnMTAwJScgaWYgaXQncyByZXNwb25zaXZlXG4gICAgICAgICAgICB3aWR0aDogdGhpcy5vcHRpb25zLnJlc3BvbnNpdmUgPyAnMTAwJScgOiBib3hTaXplLFxuICAgICAgICAgICAgaGVpZ2h0OiB0aGlzLm9wdGlvbnMucmVzcG9uc2l2ZSA/ICcxMDAlJyA6IGJveFNpemUsXG4gICAgICAgICAgICBiYWNrZ3JvdW5kQ2lyY2xlOiB7XG4gICAgICAgICAgICAgICAgY3g6IGNlbnRyZS54LFxuICAgICAgICAgICAgICAgIGN5OiBjZW50cmUueSxcbiAgICAgICAgICAgICAgICByOiB0aGlzLm9wdGlvbnMucmFkaXVzICsgdGhpcy5vcHRpb25zLm91dGVyU3Ryb2tlV2lkdGggLyAyICsgdGhpcy5vcHRpb25zLmJhY2tncm91bmRQYWRkaW5nLFxuICAgICAgICAgICAgICAgIGZpbGw6IHRoaXMub3B0aW9ucy5iYWNrZ3JvdW5kQ29sb3IsXG4gICAgICAgICAgICAgICAgZmlsbE9wYWNpdHk6IHRoaXMub3B0aW9ucy5iYWNrZ3JvdW5kT3BhY2l0eSxcbiAgICAgICAgICAgICAgICBzdHJva2U6IHRoaXMub3B0aW9ucy5iYWNrZ3JvdW5kU3Ryb2tlLFxuICAgICAgICAgICAgICAgIHN0cm9rZVdpZHRoOiB0aGlzLm9wdGlvbnMuYmFja2dyb3VuZFN0cm9rZVdpZHRoLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHBhdGg6IHtcbiAgICAgICAgICAgICAgICAvLyBBIHJ4IHJ5IHgtYXhpcy1yb3RhdGlvbiBsYXJnZS1hcmMtZmxhZyBzd2VlcC1mbGFnIHggeSAoaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4vZG9jcy9XZWIvU1ZHL1R1dG9yaWFsL1BhdGhzI0FyY3MpXG4gICAgICAgICAgICAgICAgZDogYE0gJHtzdGFydFBvaW50Lnh9ICR7c3RhcnRQb2ludC55fVxuICAgICAgICBBICR7dGhpcy5vcHRpb25zLnJhZGl1c30gJHt0aGlzLm9wdGlvbnMucmFkaXVzfSAwICR7bGFyZ2VBcmNGbGFnfSAke3N3ZWVwRmxhZ30gJHtlbmRQb2ludC54fSAke2VuZFBvaW50Lnl9YCxcbiAgICAgICAgICAgICAgICBzdHJva2U6IHRoaXMub3B0aW9ucy5vdXRlclN0cm9rZUNvbG9yLFxuICAgICAgICAgICAgICAgIHN0cm9rZVdpZHRoOiB0aGlzLm9wdGlvbnMub3V0ZXJTdHJva2VXaWR0aCxcbiAgICAgICAgICAgICAgICBzdHJva2VMaW5lY2FwOiB0aGlzLm9wdGlvbnMub3V0ZXJTdHJva2VMaW5lY2FwLFxuICAgICAgICAgICAgICAgIGZpbGw6ICdub25lJ1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNpcmNsZToge1xuICAgICAgICAgICAgICAgIGN4OiBjZW50cmUueCxcbiAgICAgICAgICAgICAgICBjeTogY2VudHJlLnksXG4gICAgICAgICAgICAgICAgcjogdGhpcy5vcHRpb25zLnJhZGl1cyAtIHRoaXMub3B0aW9ucy5zcGFjZSAtIHRoaXMub3B0aW9ucy5vdXRlclN0cm9rZVdpZHRoIC8gMiAtIHRoaXMub3B0aW9ucy5pbm5lclN0cm9rZVdpZHRoIC8gMixcbiAgICAgICAgICAgICAgICBmaWxsOiAnbm9uZScsXG4gICAgICAgICAgICAgICAgc3Ryb2tlOiB0aGlzLm9wdGlvbnMuaW5uZXJTdHJva2VDb2xvcixcbiAgICAgICAgICAgICAgICBzdHJva2VXaWR0aDogdGhpcy5vcHRpb25zLmlubmVyU3Ryb2tlV2lkdGgsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdGl0bGU6IHRpdGxlLFxuICAgICAgICAgICAgdW5pdHM6IHVuaXRzLFxuICAgICAgICAgICAgc3VidGl0bGU6IHN1YnRpdGxlLFxuICAgICAgICAgICAgaW1hZ2U6IHtcbiAgICAgICAgICAgICAgICB4OiBjZW50cmUueCAtIHRoaXMub3B0aW9ucy5pbWFnZVdpZHRoIC8gMixcbiAgICAgICAgICAgICAgICB5OiBjZW50cmUueSAtIHRoaXMub3B0aW9ucy5pbWFnZUhlaWdodCAvIDIsXG4gICAgICAgICAgICAgICAgc3JjOiB0aGlzLm9wdGlvbnMuaW1hZ2VTcmMsXG4gICAgICAgICAgICAgICAgd2lkdGg6IHRoaXMub3B0aW9ucy5pbWFnZVdpZHRoLFxuICAgICAgICAgICAgICAgIGhlaWdodDogdGhpcy5vcHRpb25zLmltYWdlSGVpZ2h0LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG91dGVyTGluZWFyR3JhZGllbnQ6IHtcbiAgICAgICAgICAgICAgICBpZDogJ291dGVyLWxpbmVhci0nICsgdGhpcy5fZ3JhZGllbnRVVUlELFxuICAgICAgICAgICAgICAgIGNvbG9yU3RvcDE6IHRoaXMub3B0aW9ucy5vdXRlclN0cm9rZUNvbG9yLFxuICAgICAgICAgICAgICAgIGNvbG9yU3RvcDI6IHRoaXMub3B0aW9ucy5vdXRlclN0cm9rZUdyYWRpZW50U3RvcENvbG9yID09PSAndHJhbnNwYXJlbnQnID8gJyNGRkYnIDogdGhpcy5vcHRpb25zLm91dGVyU3Ryb2tlR3JhZGllbnRTdG9wQ29sb3IsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmFkaWFsR3JhZGllbnQ6IHtcbiAgICAgICAgICAgICAgICBpZDogJ3JhZGlhbC0nICsgdGhpcy5fZ3JhZGllbnRVVUlELFxuICAgICAgICAgICAgICAgIGNvbG9yU3RvcDE6IHRoaXMub3B0aW9ucy5iYWNrZ3JvdW5kQ29sb3IsXG4gICAgICAgICAgICAgICAgY29sb3JTdG9wMjogdGhpcy5vcHRpb25zLmJhY2tncm91bmRHcmFkaWVudFN0b3BDb2xvciA9PT0gJ3RyYW5zcGFyZW50JyA/ICcjRkZGJyA6IHRoaXMub3B0aW9ucy5iYWNrZ3JvdW5kR3JhZGllbnRTdG9wQ29sb3IsXG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfTtcbiAgICBnZXRBbmltYXRpb25QYXJhbWV0ZXJzID0gKHByZXZpb3VzUGVyY2VudDogbnVtYmVyLCBjdXJyZW50UGVyY2VudDogbnVtYmVyKSA9PiB7XG4gICAgICAgIGNvbnN0IE1JTl9JTlRFUlZBTCA9IDEwO1xuICAgICAgICBsZXQgdGltZXM6IG51bWJlciwgc3RlcDogbnVtYmVyLCBpbnRlcnZhbDogbnVtYmVyO1xuICAgICAgICBsZXQgZnJvbVBlcmNlbnQgPSB0aGlzLm9wdGlvbnMuc3RhcnRGcm9tWmVybyA/IDAgOiAocHJldmlvdXNQZXJjZW50IDwgMCA/IDAgOiBwcmV2aW91c1BlcmNlbnQpO1xuICAgICAgICBsZXQgdG9QZXJjZW50ID0gY3VycmVudFBlcmNlbnQgPCAwID8gMCA6IHRoaXMubWluKGN1cnJlbnRQZXJjZW50LCB0aGlzLm9wdGlvbnMubWF4UGVyY2VudCk7XG4gICAgICAgIGxldCBkZWx0YSA9IE1hdGguYWJzKE1hdGgucm91bmQodG9QZXJjZW50IC0gZnJvbVBlcmNlbnQpKTtcblxuICAgICAgICBpZiAoZGVsdGEgPj0gMTAwKSB7XG4gICAgICAgICAgICAvLyB3ZSB3aWxsIGZpbmlzaCBhbmltYXRpb24gaW4gMTAwIHRpbWVzXG4gICAgICAgICAgICB0aW1lcyA9IDEwMDtcbiAgICAgICAgICAgIGlmICghdGhpcy5vcHRpb25zLmFuaW1hdGVUaXRsZSAmJiAhdGhpcy5vcHRpb25zLmFuaW1hdGVTdWJ0aXRsZSkge1xuICAgICAgICAgICAgICAgIHN0ZXAgPSAxO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBzaG93IHRpdGxlIG9yIHN1YnRpdGxlIGFuaW1hdGlvbiBldmVuIGlmIHRoZSBhcmMgaXMgZnVsbCwgd2UgYWxzbyBuZWVkIHRvIGZpbmlzaCBpdCBpbiAxMDAgdGltZXMuXG4gICAgICAgICAgICAgICAgc3RlcCA9IE1hdGgucm91bmQoZGVsdGEgLyB0aW1lcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyB3ZSB3aWxsIGZpbmlzaCBpbiBhcyBtYW55IHRpbWVzIGFzIHRoZSBudW1iZXIgb2YgcGVyY2VudC5cbiAgICAgICAgICAgIHRpbWVzID0gZGVsdGE7XG4gICAgICAgICAgICBzdGVwID0gMTtcbiAgICAgICAgfVxuICAgICAgICAvLyBHZXQgdGhlIGludGVydmFsIG9mIHRpbWVyXG4gICAgICAgIGludGVydmFsID0gTWF0aC5yb3VuZCh0aGlzLm9wdGlvbnMuYW5pbWF0aW9uRHVyYXRpb24gLyB0aW1lcyk7XG4gICAgICAgIC8vIFJlYWRqdXN0IGFsbCB2YWx1ZXMgaWYgdGhlIGludGVydmFsIG9mIHRpbWVyIGlzIGV4dHJlbWVseSBzbWFsbC5cbiAgICAgICAgaWYgKGludGVydmFsIDwgTUlOX0lOVEVSVkFMKSB7XG4gICAgICAgICAgICBpbnRlcnZhbCA9IE1JTl9JTlRFUlZBTDtcbiAgICAgICAgICAgIHRpbWVzID0gdGhpcy5vcHRpb25zLmFuaW1hdGlvbkR1cmF0aW9uIC8gaW50ZXJ2YWw7XG4gICAgICAgICAgICBpZiAoIXRoaXMub3B0aW9ucy5hbmltYXRlVGl0bGUgJiYgIXRoaXMub3B0aW9ucy5hbmltYXRlU3VidGl0bGUgJiYgZGVsdGEgPiAxMDApIHtcbiAgICAgICAgICAgICAgICBzdGVwID0gTWF0aC5yb3VuZCgxMDAgLyB0aW1lcyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHN0ZXAgPSBNYXRoLnJvdW5kKGRlbHRhIC8gdGltZXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIHN0ZXAgbXVzdCBiZSBncmVhdGVyIHRoYW4gMC5cbiAgICAgICAgaWYgKHN0ZXAgPCAxKSB7XG4gICAgICAgICAgICBzdGVwID0gMTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4ge3RpbWVzOiB0aW1lcywgc3RlcDogc3RlcCwgaW50ZXJ2YWw6IGludGVydmFsfTtcbiAgICB9O1xuICAgIGFuaW1hdGUgPSAocHJldmlvdXNQZXJjZW50OiBudW1iZXIsIGN1cnJlbnRQZXJjZW50OiBudW1iZXIpID0+IHtcbiAgICAgICAgaWYgKHRoaXMuX3RpbWVyU3Vic2NyaXB0aW9uICYmICF0aGlzLl90aW1lclN1YnNjcmlwdGlvbi5jbG9zZWQpIHtcbiAgICAgICAgICAgIHRoaXMuX3RpbWVyU3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IGZyb21QZXJjZW50ID0gdGhpcy5vcHRpb25zLnN0YXJ0RnJvbVplcm8gPyAwIDogcHJldmlvdXNQZXJjZW50O1xuICAgICAgICBsZXQgdG9QZXJjZW50ID0gY3VycmVudFBlcmNlbnQ7XG4gICAgICAgIGxldCB7c3RlcDogc3RlcCwgaW50ZXJ2YWw6IGludGVydmFsfSA9IHRoaXMuZ2V0QW5pbWF0aW9uUGFyYW1ldGVycyhmcm9tUGVyY2VudCwgdG9QZXJjZW50KTtcbiAgICAgICAgbGV0IGNvdW50ID0gZnJvbVBlcmNlbnQ7XG4gICAgICAgIGlmKGZyb21QZXJjZW50IDwgdG9QZXJjZW50KXtcbiAgICAgICAgICAgIHRoaXMuX3RpbWVyU3Vic2NyaXB0aW9uID0gdGltZXIoMCwgaW50ZXJ2YWwpLnN1YnNjcmliZSgoKSA9PiB7XG4gICAgICAgICAgICAgICAgY291bnQgKz0gc3RlcDtcbiAgICAgICAgICAgICAgICBpZiAoY291bnQgPD0gdG9QZXJjZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghdGhpcy5vcHRpb25zLmFuaW1hdGVUaXRsZSAmJiAhdGhpcy5vcHRpb25zLmFuaW1hdGVTdWJ0aXRsZSAmJiBjb3VudCA+PSAxMDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZHJhdyh0b1BlcmNlbnQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fdGltZXJTdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZHJhdyhjb3VudCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmRyYXcodG9QZXJjZW50KTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fdGltZXJTdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICB0aGlzLl90aW1lclN1YnNjcmlwdGlvbiA9IHRpbWVyKDAsIGludGVydmFsKS5zdWJzY3JpYmUoKCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvdW50IC09IHN0ZXA7XG4gICAgICAgICAgICAgICAgaWYgKGNvdW50ID49IHRvUGVyY2VudCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIXRoaXMub3B0aW9ucy5hbmltYXRlVGl0bGUgJiYgIXRoaXMub3B0aW9ucy5hbmltYXRlU3VidGl0bGUgJiYgdG9QZXJjZW50ID49IDEwMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kcmF3KHRvUGVyY2VudCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl90aW1lclN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kcmF3KGNvdW50KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZHJhdyh0b1BlcmNlbnQpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl90aW1lclN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBlbWl0Q2xpY2tFdmVudCA9IChldmVudDogYW55KSA9PiB7XG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMucmVuZGVyT25DbGljaykge1xuICAgICAgICAgICAgdGhpcy5hbmltYXRlKDAsIHRoaXMub3B0aW9ucy5wZXJjZW50KTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLm9uQ2xpY2suZW1pdChldmVudCk7XG4gICAgfTtcbiAgICBwcml2YXRlIF90aW1lclN1YnNjcmlwdGlvbjogU3Vic2NyaXB0aW9uO1xuICAgIHByaXZhdGUgYXBwbHlPcHRpb25zID0gKCkgPT4ge1xuICAgICAgICAvLyB0aGUgb3B0aW9ucyBvZiA8Y2lyY2xlLXByb2dyZXNzPiBtYXkgY2hhbmdlIGFscmVhZHlcbiAgICAgICAgZm9yIChsZXQgbmFtZSBvZiBPYmplY3Qua2V5cyh0aGlzLm9wdGlvbnMpKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5oYXNPd25Qcm9wZXJ0eShuYW1lKSAmJiB0aGlzW25hbWVdICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnNbbmFtZV0gPSB0aGlzW25hbWVdO1xuICAgICAgICAgICAgfSBlbHNlIGlmICh0aGlzLnRlbXBsYXRlT3B0aW9ucyAmJiB0aGlzLnRlbXBsYXRlT3B0aW9uc1tuYW1lXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5vcHRpb25zW25hbWVdID0gdGhpcy50ZW1wbGF0ZU9wdGlvbnNbbmFtZV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8gbWFrZSBzdXJlIGtleSBvcHRpb25zIHZhbGlkXG4gICAgICAgIHRoaXMub3B0aW9ucy5yYWRpdXMgPSBNYXRoLmFicygrdGhpcy5vcHRpb25zLnJhZGl1cyk7XG4gICAgICAgIHRoaXMub3B0aW9ucy5zcGFjZSA9ICt0aGlzLm9wdGlvbnMuc3BhY2U7XG4gICAgICAgIHRoaXMub3B0aW9ucy5wZXJjZW50ID0gK3RoaXMub3B0aW9ucy5wZXJjZW50ID4gMCA/ICt0aGlzLm9wdGlvbnMucGVyY2VudCA6IDA7XG4gICAgICAgIHRoaXMub3B0aW9ucy5tYXhQZXJjZW50ID0gTWF0aC5hYnMoK3RoaXMub3B0aW9ucy5tYXhQZXJjZW50KTtcbiAgICAgICAgdGhpcy5vcHRpb25zLmFuaW1hdGlvbkR1cmF0aW9uID0gTWF0aC5hYnModGhpcy5vcHRpb25zLmFuaW1hdGlvbkR1cmF0aW9uKTtcbiAgICAgICAgdGhpcy5vcHRpb25zLm91dGVyU3Ryb2tlV2lkdGggPSBNYXRoLmFicygrdGhpcy5vcHRpb25zLm91dGVyU3Ryb2tlV2lkdGgpO1xuICAgICAgICB0aGlzLm9wdGlvbnMuaW5uZXJTdHJva2VXaWR0aCA9IE1hdGguYWJzKCt0aGlzLm9wdGlvbnMuaW5uZXJTdHJva2VXaWR0aCk7XG4gICAgICAgIHRoaXMub3B0aW9ucy5iYWNrZ3JvdW5kUGFkZGluZyA9ICt0aGlzLm9wdGlvbnMuYmFja2dyb3VuZFBhZGRpbmc7XG4gICAgfTtcbiAgICBwcml2YXRlIGdldFJlbGF0aXZlWSA9IChyb3dOdW06IG51bWJlciwgcm93Q291bnQ6IG51bWJlcik6IHN0cmluZyA9PiB7XG4gICAgICAgIC8vIHdoeSAnLTAuMThlbSc/IEl0J3MgYSBtYWdpYyBudW1iZXIgd2hlbiBwcm9wZXJ0eSAnYWxpZ25tZW50LWJhc2VsaW5lJyBlcXVhbHMgJ2Jhc2VsaW5lJy4gOilcbiAgICAgICAgbGV0IGluaXRpYWxPZmZzZXQgPSAtMC4xOCwgb2Zmc2V0ID0gMTtcbiAgICAgICAgcmV0dXJuIChpbml0aWFsT2Zmc2V0ICsgb2Zmc2V0ICogKHJvd051bSAtIHJvd0NvdW50IC8gMikpLnRvRml4ZWQoMikgKyAnZW0nO1xuICAgIH07XG5cbiAgICBwcml2YXRlIG1pbiA9IChhOiBudW1iZXIsIGI6IG51bWJlcikgPT4ge1xuICAgICAgICByZXR1cm4gYSA8IGIgPyBhIDogYjtcbiAgICB9O1xuXG4gICAgcHJpdmF0ZSBtYXggPSAoYTogbnVtYmVyLCBiOiBudW1iZXIpID0+IHtcbiAgICAgICAgcmV0dXJuIGEgPiBiID8gYSA6IGI7XG4gICAgfTtcblxuICAgIHByaXZhdGUgdXVpZCA9ICgpID0+IHtcbiAgICAgICAgLy8gaHR0cHM6Ly93d3cudzNyZXNvdXJjZS5jb20vamF2YXNjcmlwdC1leGVyY2lzZXMvamF2YXNjcmlwdC1tYXRoLWV4ZXJjaXNlLTIzLnBocFxuICAgICAgICB2YXIgZHQgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgICAgICAgdmFyIHV1aWQgPSAneHh4eHh4eHgteHh4eC00eHh4LXl4eHgteHh4eHh4eHh4eHh4Jy5yZXBsYWNlKC9beHldL2csIGZ1bmN0aW9uKGMpIHtcbiAgICAgICAgICAgIHZhciByID0gKGR0ICsgTWF0aC5yYW5kb20oKSoxNiklMTYgfCAwO1xuICAgICAgICAgICAgZHQgPSBNYXRoLmZsb29yKGR0LzE2KTtcbiAgICAgICAgICAgIHJldHVybiAoYz09J3gnID8gciA6KHImMHgzfDB4OCkpLnRvU3RyaW5nKDE2KTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiB1dWlkO1xuICAgIH1cblxuICAgIHB1YmxpYyBpc0RyYXdpbmcoKTogYm9vbGVhbiB7XG4gICAgICAgIHJldHVybiAodGhpcy5fdGltZXJTdWJzY3JpcHRpb24gJiYgIXRoaXMuX3RpbWVyU3Vic2NyaXB0aW9uLmNsb3NlZCk7XG4gICAgfVxuXG4gICAgcHVibGljIGZpbmRTdmdFbGVtZW50ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmKHRoaXMuc3ZnRWxlbWVudCA9PT0gbnVsbCl7XG4gICAgICAgICAgICBsZXQgdGFncyA9IHRoaXMuZWxSZWYubmF0aXZlRWxlbWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnc3ZnJyk7XG4gICAgICAgICAgICBpZih0YWdzLmxlbmd0aD4wKXtcbiAgICAgICAgICAgICAgICB0aGlzLnN2Z0VsZW1lbnQgPSB0YWdzWzBdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBpc0VsZW1lbnRJblZpZXdwb3J0IChlbCkgOiBCb29sZWFuIHtcbiAgICAgICAgLy8gUmV0dXJuIGZhbHNlIGlmIGVsIGhhcyBub3QgYmVlbiBjcmVhdGVkIGluIHBhZ2UuXG4gICAgICAgIGlmKGVsID09PSBudWxsIHx8IGVsID09PSB1bmRlZmluZWQpIHJldHVybiBmYWxzZTtcbiAgICAgICAgLy8gQ2hlY2sgaWYgdGhlIGVsZW1lbnQgaXMgb3V0IG9mIHZpZXcgZHVlIHRvIGEgY29udGFpbmVyIHNjcm9sbGluZ1xuICAgICAgICBsZXQgcmVjdCA9IGVsLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLCBwYXJlbnQgPSBlbC5wYXJlbnROb2RlLCBwYXJlbnRSZWN0O1xuICAgICAgICBkbyB7XG4gICAgICAgICAgcGFyZW50UmVjdCA9IHBhcmVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgICAgICBpZiAocmVjdC50b3AgPj0gcGFyZW50UmVjdC5ib3R0b20pIHJldHVybiBmYWxzZTtcbiAgICAgICAgICBpZiAocmVjdC5ib3R0b20gPD0gcGFyZW50UmVjdC50b3ApIHJldHVybiBmYWxzZTtcbiAgICAgICAgICBpZiAocmVjdC5sZWZ0ID49IHBhcmVudFJlY3QucmlnaHQpIHJldHVybiBmYWxzZTtcbiAgICAgICAgICBpZiAocmVjdC5yaWdodCA8PSBwYXJlbnRSZWN0LmxlZnQpIHJldHVybiBmYWxzZTtcbiAgICAgICAgICBwYXJlbnQgPSBwYXJlbnQucGFyZW50Tm9kZTtcbiAgICAgICAgfSB3aGlsZSAocGFyZW50ICE9IHRoaXMuZG9jdW1lbnQuYm9keSk7XG4gICAgICAgIC8vIENoZWNrIGl0cyB3aXRoaW4gdGhlIGRvY3VtZW50IHZpZXdwb3J0XG4gICAgICAgIGlmIChyZWN0LnRvcCA+PSAodGhpcy53aW5kb3cuaW5uZXJIZWlnaHQgfHwgdGhpcy5kb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50SGVpZ2h0KSkgcmV0dXJuIGZhbHNlO1xuICAgICAgICBpZiAocmVjdC5ib3R0b20gPD0gMCkgcmV0dXJuIGZhbHNlO1xuICAgICAgICBpZiAocmVjdC5sZWZ0ID49ICh0aGlzLndpbmRvdy5pbm5lcldpZHRoIHx8IHRoaXMuZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsaWVudFdpZHRoKSkgcmV0dXJuIGZhbHNlO1xuICAgICAgICBpZiAocmVjdC5yaWdodCA8PSAwKSByZXR1cm4gZmFsc2U7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIGNoZWNrVmlld3BvcnQgPSAoKSA9PiB7XG4gICAgICAgIHRoaXMuZmluZFN2Z0VsZW1lbnQoKTtcbiAgICAgICAgbGV0IHByZXZpb3VzVmFsdWUgPSB0aGlzLmlzSW5WaWV3cG9ydDtcbiAgICAgICAgdGhpcy5pc0luVmlld3BvcnQgPSB0aGlzLmlzRWxlbWVudEluVmlld3BvcnQodGhpcy5zdmdFbGVtZW50KTtcbiAgICAgICAgaWYocHJldmlvdXNWYWx1ZSAhPT0gdGhpcy5pc0luVmlld3BvcnQpIHtcbiAgICAgICAgICAgIHRoaXMub25WaWV3cG9ydENoYW5nZWQuZW1pdCh7b2xkVmFsdWU6IHByZXZpb3VzVmFsdWUsIG5ld1ZhbHVlOiB0aGlzLmlzSW5WaWV3cG9ydH0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgb25TY3JvbGwgPSAoZXZlbnQ6IEV2ZW50KSA9PiB7XG4gICAgICAgIHRoaXMuY2hlY2tWaWV3cG9ydCgpO1xuICAgIH1cblxuICAgIGxvYWRFdmVudHNGb3JMYXp5TW9kZSA9ICgpID0+IHtcbiAgICAgICAgaWYodGhpcy5vcHRpb25zLmxhenkpe1xuICAgICAgICAgICAgdGhpcy5kb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdzY3JvbGwnLCB0aGlzLm9uU2Nyb2xsLCB0cnVlKTtcbiAgICAgICAgICAgIHRoaXMud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsIHRoaXMub25TY3JvbGwsIHRydWUpO1xuICAgICAgICAgICAgaWYodGhpcy5fdmlld3BvcnRDaGFuZ2VkU3Vic2NyaWJlciA9PT0gbnVsbCl7XG4gICAgICAgICAgICAgICAgdGhpcy5fdmlld3BvcnRDaGFuZ2VkU3Vic2NyaWJlciA9IHRoaXMub25WaWV3cG9ydENoYW5nZWQuc3Vic2NyaWJlKCh7b2xkVmFsdWUsIG5ld1ZhbHVlfSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBuZXdWYWx1ZSA/IHRoaXMucmVuZGVyKCkgOiBudWxsO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gc3ZnRWxlbWVudCBtdXN0IGJlIGNyZWF0ZWQgaW4gRE9NIGJlZm9yZSBiZWluZyBjaGVja2VkLlxuICAgICAgICAgICAgLy8gSXMgdGhlcmUgYSBiZXR0ZXIgd2F5IHRvIGNoZWNrIHRoZSBleGlzdGVuY2Ugb2Ygc3ZnRWxlbW50P1xuICAgICAgICAgICAgbGV0IF90aW1lciA9IHRpbWVyKDAsIDUwKS5zdWJzY3JpYmUoKCk9PntcbiAgICAgICAgICAgICAgICB0aGlzLnN2Z0VsZW1lbnQgPT09IG51bGwgPyB0aGlzLmNoZWNrVmlld3BvcnQoKSA6IF90aW1lci51bnN1YnNjcmliZSgpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHVubG9hZEV2ZW50c0ZvckxhenlNb2RlID0gKCkgPT4ge1xuICAgICAgICAvLyBSZW1vdmUgZXZlbnQgbGlzdGVuZXJzXG4gICAgICAgIHRoaXMuZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignc2Nyb2xsJywgdGhpcy5vblNjcm9sbCwgdHJ1ZSk7XG4gICAgICAgIHRoaXMud2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsIHRoaXMub25TY3JvbGwsIHRydWUpO1xuICAgICAgICAvLyBVbnN1YnNjcmliZSBvblZpZXdwb3J0Q2hhbmdlZFxuICAgICAgICBpZih0aGlzLl92aWV3cG9ydENoYW5nZWRTdWJzY3JpYmVyICE9PSBudWxsKXtcbiAgICAgICAgICAgIHRoaXMuX3ZpZXdwb3J0Q2hhbmdlZFN1YnNjcmliZXIudW5zdWJzY3JpYmUoKTtcbiAgICAgICAgICAgIHRoaXMuX3ZpZXdwb3J0Q2hhbmdlZFN1YnNjcmliZXIgPSBudWxsO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgbmdPbkluaXQoKXtcbiAgICAgICAgdGhpcy5sb2FkRXZlbnRzRm9yTGF6eU1vZGUoKTtcbiAgICB9XG5cbiAgICBuZ09uRGVzdHJveSgpe1xuICAgICAgICB0aGlzLnVubG9hZEV2ZW50c0ZvckxhenlNb2RlKCk7XG4gICAgfVxuXG4gICAgbmdPbkNoYW5nZXMoY2hhbmdlczogU2ltcGxlQ2hhbmdlcykge1xuICAgICAgICBcbiAgICAgICAgdGhpcy5yZW5kZXIoKTtcblxuICAgICAgICBpZignbGF6eScgaW4gY2hhbmdlcyl7XG4gICAgICAgICAgICBjaGFuZ2VzLmxhenkuY3VycmVudFZhbHVlID8gdGhpcy5sb2FkRXZlbnRzRm9yTGF6eU1vZGUoKSA6IHRoaXMudW5sb2FkRXZlbnRzRm9yTGF6eU1vZGUoKTtcbiAgICAgICAgfVxuXG4gICAgfVxuICAgIFxuICAgIGNvbnN0cnVjdG9yKGRlZmF1bHRPcHRpb25zOiBDaXJjbGVQcm9ncmVzc09wdGlvbnMsIHByaXZhdGUgZWxSZWY6IEVsZW1lbnRSZWYsIEBJbmplY3QoRE9DVU1FTlQpIHByaXZhdGUgZG9jdW1lbnQ6IGFueSkge1xuICAgICAgICB0aGlzLmRvY3VtZW50ID0gZG9jdW1lbnQ7XG4gICAgICAgIHRoaXMud2luZG93ID0gdGhpcy5kb2N1bWVudC5kZWZhdWx0VmlldztcbiAgICAgICAgT2JqZWN0LmFzc2lnbih0aGlzLm9wdGlvbnMsIGRlZmF1bHRPcHRpb25zKTtcbiAgICAgICAgT2JqZWN0LmFzc2lnbih0aGlzLmRlZmF1bHRPcHRpb25zLCBkZWZhdWx0T3B0aW9ucyk7XG4gICAgfVxuXG59XG4iXX0=