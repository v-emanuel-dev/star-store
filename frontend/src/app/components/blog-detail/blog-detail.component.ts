import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { Category } from '../../models/category.model';
import { Comment } from '../../models/comment.model';
import { Post } from '../../models/post.model';
import { AuthService } from '../../services/auth.service';
import { CategoryService } from '../../services/category.service';
import { CommentService } from '../../services/comment.service';
import { PostService } from '../../services/post.service';

@Component({
  selector: 'app-blog-detail',
  templateUrl: './blog-detail.component.html',
  styleUrls: ['./blog-detail.component.css'],
})
export class BlogDetailComponent implements OnInit, OnDestroy {
  postId: number = 0;
  post: Post | null = null;
  comments: Comment[] = [];
  newComment: string = '';
  editCommentId: number | null = null;
  editCommentContent: string = '';
  username: string | undefined;
  isLoggedIn: boolean = false;
  categories: Category[] = [];
  allCategories: Category[] = [];
  newCategoryName: string = '';
  editCategoryId: number | null = null;
  editCategoryName: string = '';
  isModalOpen = false;
  currentCommentId: number | null = null;
  loading: boolean = false;

  private userDetailsSubscription: Subscription = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private postService: PostService,
    private commentService: CommentService,
    private authService: AuthService,
    private categoryService: CategoryService,
    private snackBar: MatSnackBar
  ) {
    this.userDetailsSubscription = this.authService.userDetails$
      .pipe(filter((details) => details !== null))
      .subscribe((details) => {
        if (details && details.username) {
          this.username = details.username;
        }
      });
  }

  ngOnInit(): void {
    const postIdParam = this.route.snapshot.paramMap.get('id');
    if (postIdParam) {
      this.postId = +postIdParam;
      this.isLoggedIn = this.authService.isLoggedIn();
      this.loadPost();
      this.loadComments();
      this.loadCategories();
    }
  }

  toggleLike(postId: number): void {
    this.postService.toggleLike(postId).subscribe(
      (response) => {
        this.loadPost();
      },
      (error) => {
        this.snackbar('Error liking/unliking post');
      }
    );
  }

  loadPost(): void {
    this.loading = true;

    this.postService.getPostById(this.postId).subscribe(
      (post) => {
        this.post = post;
        this.post.comments = this.post.comments || [];
        this.loading = false;
      },
      (error) => {
        this.snackbar('Error loading post');
        this.loading = false;
      }
    );
  }

  loadComments(): void {
    this.loading = true;

    this.commentService.getCommentsByPostId(this.postId).subscribe(
      (comments: Comment[]) => {
        this.comments = comments;
        if (this.comments.length === 0) {
          this.snackbar('No comments found');
        }
        this.loading = false;
      },
      (error) => {
        this.snackbar('Error loading comments');
        this.loading = false;
      }
    );
  }

  loadCategories(): void {
    this.loading = true;
    this.categoryService.getCategoriesByPostId(this.postId).subscribe(
      (data: Category[]) => {
        this.categories = data.sort((a, b) => (b.id ?? 0) - (a.id ?? 0));
        this.loading = false;
      },
      (error) => {
        this.snackbar('Error fetching categories');
        this.loading = false;
      }
    );
  }

  addComment(): void {
    const userId = parseInt(localStorage.getItem('userId') || '0', 10) || null;
    const username = localStorage.getItem('username') || 'Anonymous';

    if (!this.newComment.trim()) {
      this.snackbar('Comment cannot be empty');
      return;
    }

    const comment: Comment = {
      postId: this.postId,
      userId: userId,
      content: this.newComment,
      created_at: new Date().toISOString(),
      visibility: 'public',
      username,
    };

    this.loading = true;

    this.commentService.addComment(comment).subscribe(
      (newComment) => {
        this.comments.push(newComment);
        this.newComment = '';
        this.loading = false;
      },
      (error) => {
        this.snackbar('Error adding comment');
        this.loading = false;
      }
    );
  }

  editComment(comment: Comment): void {
    this.editCommentId = comment.id ?? null;
    this.editCommentContent = comment.content;
  }

  saveComment(): void {
    if (this.editCommentContent && this.editCommentId !== null) {
      const commentToUpdate = this.comments.find(
        (c) => c.id === this.editCommentId
      );

      if (commentToUpdate) {
        const updatedComment: Comment = {
          ...commentToUpdate,
          content: this.editCommentContent,
        };

        this.loading = true;

        this.commentService
          .updateComment(this.editCommentId, updatedComment)
          .subscribe(
            (response) => {
              const index = this.comments.findIndex(
                (c) => c.id === this.editCommentId
              );
              if (index !== -1) {
                this.comments[index].content = updatedComment.content;
              }
              this.cancelEdit();
              this.loading = false;
            },
            (error) => {
              this.snackbar('Error saving comment');
              this.loading = false;
            }
          );
      }
    }
  }

  deleteComment(commentId: number): void {
    this.commentService.deleteComment(commentId).subscribe(() => {
      this.comments = this.comments.filter(
        (comment) => comment.id !== commentId
      );
    });
  }

  cancelEdit(): void {
    this.editCommentId = null;
    this.editCommentContent = '';
  }

  addCategory(): void {
    if (this.newCategoryName.trim()) {
      const category: Omit<Category, 'id'> = {
        name: this.newCategoryName,
        postId: this.postId,
      };

      this.loading = true;

      this.categoryService.createCategory(category).subscribe(
        () => {
          this.loadCategories();
          this.newCategoryName = '';
          this.loading = false;
        },
        (error) => {
          this.snackbar('Error creating category');
          this.loading = false;
        }
      );
    } else {
      this.snackbar('Category name cannot be empty');
    }
  }

  editCategory(category: Category): void {
    this.editCategoryId = category.id ?? null;
    this.editCategoryName = category.name;
  }

  saveCategory(): void {
    if (this.editCategoryId && this.editCategoryName) {
      const updatedCategory: Category = {
        id: this.editCategoryId,
        name: this.editCategoryName,
        postId: this.postId,
      };

      this.loading = true;

      this.categoryService
        .updateCategory(this.editCategoryId, updatedCategory)
        .subscribe(
          () => {
            this.loadCategories();
            this.cancelEditCategory();
            this.loading = false;
          },
          (error) => {
            this.snackbar('Error updating category');
            this.loading = false;
          }
        );
    } else {
      this.snackbar('Category name and post ID cannot be empty');
    }
  }

  deleteCategoryFromPost(postId: number, categoryId: number): void {
    this.categoryService.deleteCategoryFromPost(categoryId, postId).subscribe(
      () => {
        this.loadCategories();
      },
      (error) => {
        this.snackbar('Error deleting category association from post');
      }
    );
  }

  cancelEditCategory(): void {
    this.editCategoryId = null;
    this.editCategoryName = '';
  }

  openCommentModal(commentId: number): void {
    this.currentCommentId = commentId;
    this.isModalOpen = true;
  }

  confirmDeleteComment(commentId: number): void {
    this.openCommentModal(commentId);
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.currentCommentId = null;
  }

  deleteCommentModal(commentId: number): void {
    if (commentId) {
      this.commentService.deleteComment(commentId).subscribe({
        next: () => {
          this.comments = this.comments.filter(
            (comment) => comment.id !== commentId
          );
          this.closeModal();
        },
        error: (err) => {
          this.snackbar('Error deleting comment');
        },
      });
    } else {
      this.snackbar('Invalid comment ID');
    }
  }

  ngOnDestroy(): void {
    this.userDetailsSubscription.unsubscribe();
  }

  snackbar(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: 'star-snackbar',
    });
  }
}
