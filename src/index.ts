import BoundboxEncoder from './encoders/boundbox.encoder'

export default {
    install(Vue: any, opts: any) {

        // encoders
        Vue.use(BoundboxEncoder)
    }
}