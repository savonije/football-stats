import dayjs from 'dayjs'
import LocalizedFormat from 'dayjs/plugin/localizedFormat'

import 'dayjs/locale/nl'

dayjs.extend(LocalizedFormat)

dayjs.locale('nl')
