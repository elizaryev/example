/*
    This file describes common animations used in the project
*/

import { TweenMax, Elastic } from 'gsap';

const duration: number = 0.5;

type NullableTarget = {} | null;

export default {
    show(target: NullableTarget | null, cb?: () => void)
    {
        if (target === null) {
            return null;
        }
        return TweenMax.from(target, duration, {
            opacity: 0,
            height: 0,
            onComplete() { if(cb !== undefined && cb!==null) cb() },
            ease: Elastic.easeOut.config(0.25, 1)
        })
    },
    hide(target: NullableTarget, cb?: () => void) {
        if (target === null) {
            return null;
        }
        return TweenMax.from(target, duration, {
            opacity: 0,
            height: 0,
            onComplete() { if(cb !== undefined && cb!==null)cb() },
            ease: Elastic.easeIn.config(0.25, 1)
        })
    }
}