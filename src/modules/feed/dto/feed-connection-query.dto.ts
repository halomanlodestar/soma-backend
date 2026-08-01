import { ArgsType } from '@nestjs/graphql';
import { CursorPaginationArgs } from '../../../common/pagination/dto/cursor-pagination.args';

@ArgsType()
export class FeedConnectionQueryDto extends CursorPaginationArgs {}
