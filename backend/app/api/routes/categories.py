from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models.category import Category
from app.models.user import User
from app.schemas.category import CategoryCreate, CategoryUpdate, CategoryResponse, CategoryTree, CategoryReorder
from app.api.deps import require_admin

router = APIRouter()


def build_category_tree(categories: List[Category], parent_id: int = None) -> List[CategoryTree]:
    """
    재귀적으로 카테고리 트리 구조 생성
    """
    tree = []
    for category in categories:
        if category.parent_id == parent_id:
            children = build_category_tree(categories, category.id)
            cat_dict = {
                "id": category.id,
                "name": category.name,
                "description": category.description,
                "parent_id": category.parent_id,
                "order_index": category.order_index,
                "created_at": category.created_at,
                "children": children
            }
            tree.append(CategoryTree(**cat_dict))

    # order_index로 정렬
    tree.sort(key=lambda x: x.order_index)
    return tree


@router.get("/tree", response_model=List[CategoryTree])
async def get_category_tree(db: Session = Depends(get_db)):
    """
    트리 구조로 모든 카테고리 조회
    """
    categories = db.query(Category).all()
    return build_category_tree(categories)


@router.get("/", response_model=List[CategoryResponse])
async def get_categories(db: Session = Depends(get_db)):
    """
    평면 리스트로 모든 카테고리 조회
    """
    categories = db.query(Category).order_by(Category.order_index).all()
    return categories


@router.get("/{category_id}", response_model=CategoryResponse)
async def get_category(category_id: int, db: Session = Depends(get_db)):
    """
    특정 카테고리 조회
    """
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return category


@router.post("/", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(
    category_data: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    새 카테고리 생성 (관리자만)
    """
    # parent_id가 있다면 존재하는지 확인
    if category_data.parent_id:
        parent = db.query(Category).filter(Category.id == category_data.parent_id).first()
        if not parent:
            raise HTTPException(status_code=404, detail="Parent category not found")

    # 같은 parent 아래에서 같은 이름이 있는지 확인
    existing = db.query(Category).filter(
        Category.name == category_data.name,
        Category.parent_id == category_data.parent_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Category with this name already exists under the same parent")

    # order_index가 지정되지 않았다면 마지막으로 설정
    if category_data.order_index == 0:
        max_order = db.query(Category).filter(
            Category.parent_id == category_data.parent_id
        ).count()
        category_data.order_index = max_order

    category = Category(**category_data.model_dump())
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


@router.put("/{category_id}", response_model=CategoryResponse)
async def update_category(
    category_id: int,
    category_data: CategoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    카테고리 수정 (관리자만)
    """
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    # parent_id가 변경되었다면 순환 참조 확인
    if category_data.parent_id is not None and category_data.parent_id != category.parent_id:
        # 자기 자신을 부모로 설정할 수 없음
        if category_data.parent_id == category_id:
            raise HTTPException(status_code=400, detail="Category cannot be its own parent")

        # 자식 카테고리를 부모로 설정할 수 없음 (순환 참조 방지)
        def is_descendant(potential_parent_id: int, category_id: int) -> bool:
            if potential_parent_id is None:
                return False
            parent = db.query(Category).filter(Category.id == potential_parent_id).first()
            if not parent:
                return False
            if parent.id == category_id:
                return True
            return is_descendant(parent.parent_id, category_id)

        if is_descendant(category_data.parent_id, category_id):
            raise HTTPException(status_code=400, detail="Cannot create circular reference")

    # 업데이트
    update_data = category_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(category, field, value)

    db.commit()
    db.refresh(category)
    return category


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    카테고리 삭제 (관리자만)
    하위 카테고리가 있으면 삭제 불가
    """
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    # 하위 카테고리 확인
    children = db.query(Category).filter(Category.parent_id == category_id).count()
    if children > 0:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete category with children. Delete or move children first."
        )

    db.delete(category)
    db.commit()


@router.post("/reorder", status_code=status.HTTP_200_OK)
async def reorder_categories(
    reorder_data: List[CategoryReorder],
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    카테고리 순서 변경 (drag & drop 지원)
    """
    for item in reorder_data:
        category = db.query(Category).filter(Category.id == item.id).first()
        if category:
            category.parent_id = item.parent_id
            category.order_index = item.order_index

    db.commit()
    return {"message": "Categories reordered successfully"}
