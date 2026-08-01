import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { Express } from 'express';
import { CollectionsService } from './collections.service';
import { Post } from '../posts/entities/post.entity';
import { Collection } from './entities/collection.entity';
import { CollectionItem } from './entities/collection-item.entity';

@Resolver()
export class CollectionsResolver {
  constructor(private readonly service: CollectionsService) {}

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  async savePost(
    @CurrentUser() user: Express.User,
    @Args('postId') postId: string,
  ) {
    return Boolean(await this.service.savePost(user.id, postId));
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  unsavePost(
    @CurrentUser() user: Express.User,
    @Args('postId') postId: string,
  ) {
    return this.service.unsavePost(user.id, postId);
  }

  @Query(() => Boolean)
  @UseGuards(JwtAuthGuard)
  isPostSaved(
    @CurrentUser() user: Express.User,
    @Args('postId') postId: string,
  ) {
    return this.service.isPostSaved(user.id, postId);
  }

  @Query(() => [Post])
  @UseGuards(JwtAuthGuard)
  mySavedPosts(@CurrentUser() user: Express.User) {
    return this.service.savedPosts(user.id);
  }

  @Mutation(() => Collection)
  @UseGuards(JwtAuthGuard)
  createCollection(
    @CurrentUser() user: Express.User,
    @Args('title') title: string,
    @Args('description', { nullable: true }) description?: string,
    @Args('isPublic', { nullable: true }) isPublic?: boolean,
  ) {
    return this.service.createCollection(user.id, title, description, isPublic);
  }

  @Query(() => [Collection])
  @UseGuards(JwtAuthGuard)
  myCollections(@CurrentUser() user: Express.User) {
    return this.service.myCollections(user.id);
  }

  @Mutation(() => CollectionItem, { nullable: true })
  @UseGuards(JwtAuthGuard)
  addPostToCollection(
    @CurrentUser() user: Express.User,
    @Args('collectionId') collectionId: string,
    @Args('postId') postId: string,
  ) {
    return this.service.addPost(user.id, collectionId, postId);
  }

  @Query(() => [CollectionItem], { nullable: true })
  @UseGuards(JwtAuthGuard)
  collectionItems(
    @CurrentUser() user: Express.User,
    @Args('collectionId') collectionId: string,
  ) {
    return this.service.collectionItems(user.id, collectionId);
  }
}
