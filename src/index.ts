import BoundboxEncoder from './encoders/boundbox.encoder'
import PolylineEncoder from './encoders/polyline.encoder'
import PixelwiseEncoder from './encoders/pixelwise.encoder'

export default {
    install(Vue: any, opts: any) {

        // encoders
        Vue.use(BoundboxEncoder)
        Vue.use(PolylineEncoder)
        Vue.use(PixelwiseEncoder)
    }
}