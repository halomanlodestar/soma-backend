import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { Express } from 'express';
import { CollectionsService } from './collections.service';
import { Post } from '../posts/entities/post.entity';
import { Collection } from './entities/collection.entity';
import { CollectionItem } from './entities/collection-item.entity';
import {
  CreateCollectionInput,
  UpdateCollectionInput,
  CollectionPostInput,
  ReorderCollectionItemsInput,
} from './dto/collection.inputs';

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
    @Args('input') input: CreateCollectionInput,
  ) {
    return this.service.createCollection(
      user.id,
      input.title,
      input.description,
      input.isPublic,
    );
  }

  @Mutation(() => Collection, { nullable: true })
  @UseGuards(JwtAuthGuard)
  updateCollection(
    @CurrentUser() user: Express.User,
    @Args('input') input: UpdateCollectionInput,
  ) {
    const { collectionId, ...data } = input;
    return this.service.updateCollection(user.id, collectionId, data);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  deleteCollection(
    @CurrentUser() user: Express.User,
    @Args('collectionId') collectionId: string,
  ) {
    return this.service.deleteCollection(user.id, collectionId);
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
    @Args('input') input: CollectionPostInput,
  ) {
    return this.service.addPost(user.id, input.collectionId, input.postId);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  removePostFromCollection(
    @CurrentUser() user: Express.User,
    @Args('input') input: CollectionPostInput,
  ) {
    return this.service.removePost(user.id, input.collectionId, input.postId);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  reorderCollectionItems(
    @CurrentUser() user: Express.User,
    @Args('input') input: ReorderCollectionItemsInput,
  ) {
    return this.service.reorder(user.id, input.collectionId, input.postIds);
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
