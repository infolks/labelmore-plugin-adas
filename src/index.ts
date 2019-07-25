import JsonEncoder from './encoders/json.encoder'
import { Plugin } from '@infolks/labelmore-devkit';

export default Plugin.Package({
    plugins: [
        JsonEncoder
    ]
})