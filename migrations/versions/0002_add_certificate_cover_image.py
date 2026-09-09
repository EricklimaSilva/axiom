"""Add cover_image_path to certificates

Revision ID: 0002_add_certificate_cover_image
Revises: 0001_axiom_persistence
Create Date: 2026-09-09 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "0002_add_certificate_cover_image"
down_revision = "0001_axiom_persistence"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("certificates", sa.Column("cover_image_path", sa.Text(), nullable=True))


def downgrade():
    op.drop_column("certificates", "cover_image_path")
